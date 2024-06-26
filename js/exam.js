async function loadCoursesForExam(options = "id") {
  let courseViewContainer = document.querySelector(".course-view-container");
  let loader = courseViewContainer.querySelector(
    ".course-view-container-loader"
  );

  let noCoursesYetText = createLocalizedTextElement("No courses yet");
  let createCourseText = createLocalizedTextElement("Create Course");
  let errorText = createLocalizedTextElement("Something Went Wrong");

  let emptyView = createElement("div", "container-message");
  let largeMessage = createElement("div", "large-message");
  largeMessage.appendChild(noCoursesYetText);

  let createCourseButton = createElement("div", "button");
  createCourseButton.appendChild(createCourseText);
  createCourseButton.addEventListener("click", () => openCreateCourseOverlay());

  emptyView.appendChild(largeMessage);
  emptyView.appendChild(createCourseButton);

  let errorView = createElement("div", "container-message");
  largeMessage.innerHTML = "";
  largeMessage.appendChild(errorText);
  errorView.appendChild(largeMessage);

  /* STUDENT VIEW */
  let studentEmptyView = createElement("div", "container-message");
  let NoCoursesYet = createLocalizedTextElement("No Courses Yet");
  let studentlargeMessage = createElement("div", "large-message");
  studentlargeMessage.appendChild(NoCoursesYet);
  studentEmptyView.appendChild(studentlargeMessage);

  let myEmptyView = createElement("div", "container-message");
  let NoSelectedCoursesYet = createLocalizedTextElement(
    "You haven't chosen any courses yet"
  );
  let myLargeMessage = createElement("div", "large-message");
  myLargeMessage.appendChild(NoSelectedCoursesYet);
  myEmptyView.appendChild(myLargeMessage);

  return new Promise(async (resolve, reject) => {
    let { id: userID } = await getGlobalDetails();

    try {
      const params = `id=${userID}`;

      let phpFilePath;

      switch (options) {
        case "id":
          phpFilePath = "../include/course/getCourses.php";
          break;
        case "all":
          phpFilePath = "../include/course/getAllCourses.php";
          break;
        case "mine":
          phpFilePath = "../include/course/getMyCourses.php";
          break;
      }

      const result = await AJAXCall({
        phpFilePath,
        rejectMessage: "Getting Courses Failed",
        params,
        type: "fetch",
      });

      setTimeout(() => {
        // console.log("result", result);

        if (result && result.length > 0) {
          // console.log("so far so good.");
          loadCoursesUIForExam(result, options, userID);
          resolve();
        } else {
          //TODO: This part might cause bugs in future versions
          courseViewContainer.innerHTML = "";

          // console.log("options: ", options);

          switch (options) {
            case "id": // Refactor this to be "teacher"
              courseViewContainer.appendChild(emptyView);
              break;
            case "all": // Refactor this to be "student subscriptions"
              courseViewContainer.appendChild(studentEmptyView);
            case "mine": // Refactor this to be "mine -- or -- classview"
              courseViewContainer.appendChild(myEmptyView);
          }
        }
      }, 2000);
    } catch (error) {}
  });

  function loadCoursesUIForExam(coursesObject, options, userID) {
    courseViewContainer.innerHTML = "";

    coursesObject.map(async (course) => {
      const { id, title, image, courseCode } = course;

      let courseCard = createElement("div", "course-card");

      let courseCardImage = createElement("div", "course-card-image");
      let imageElement = document.createElement("img");

      imageElement.src =
        image.length > 2
          ? await checkImage(`../uploads/${image}`)
          : `../assets/images/courseDefault.jpg`;

      courseCardImage.appendChild(imageElement);

      let cardText = createElement("div", "card-text");
      let courseCardCode = createElement("div", "course-card-code");
      let courseCardTitle = createElement("div", "course-card-title");

      courseCardCode.textContent = courseCode;
      courseCardTitle.textContent = title;

      cardText.appendChild(courseCardCode);
      cardText.appendChild(courseCardTitle);

      let cardOverlay = createElement("div", "card-overlay");

      courseCard.appendChild(courseCardImage);
      courseCard.appendChild(cardText);
      courseCard.appendChild(cardOverlay);

      let subscriptionResult = await getCourseSubscriptionStatus(id, userID);

      courseCard.addEventListener("click", () => {
        switch (options) {
          case "id":
            goToExams(id);
            break;
          case "all":
            // TODO: Using Subscriptions, toggle different popups.
            subscriptionEvent(subscriptionResult, { id, userID })();
            break;
          case "mine":
            goToCourse(id);
            break;
        }
      });

      // This is the subscription part for the student view.
      let subscriptionIcon = document.createElement("div");
      subscriptionIcon.className = "subscription-icon";
      let tickImageElement = document.createElement("img");
      tickImageElement.src = "../assets/icons/check.png";
      subscriptionIcon.appendChild(tickImageElement);

      try {
        if (subscriptionResult[0].status == "true") {
          //   courseCard.appendChild(subscriptionIcon);
        }
      } catch (error) {}
      // ENDS HERE

      courseViewContainer.appendChild(courseCard);
    });

    function subscriptionEvent(subscriptionArray, { id, userID }) {
      try {
        if (subscriptionArray.length > 0) {
          let status = subscriptionArray[0];
          console.log("status: ", status);
          if (status.status == "true")
            return () => showDeRegisterPopup(id, userID);
          // else return showDeRegisterPopup;
        } else return () => showRegisterPopup(id, userID);
      } catch (error) {}
    }

    function showDeRegisterPopup(courseID, userID) {
      console.log(
        "Course has been registered, click will bring up de registration option"
      );
    }

    function showRegisterPopup(courseID, userID) {
      let enrollButton = document.querySelector(".enroll-course-button");
      enrollButton.setAttribute("data-courseID", courseID);
      enrollButton.setAttribute("data-userID", userID);

      openPopup(".register-to-course");

      console.log("Course has not been registered");
    }
  }

  async function getCourseSubscriptionStatus(id, userID) {
    return await AJAXCall({
      phpFilePath: "../include/course/getSubscriptionStatus.php",
      rejectMessage: "Getting Status Failed",
      params: `id=${id}&&userID=${userID}`,
      type: "fetch",
    });
  }

  function goToCourse(id) {
    console.log("curent id:", id);
    openPopup(".classroom-inner-overlay");
    let classRoomOverlay = document.querySelector(".classroom-inner-overlay");
    classRoomOverlay.setAttribute("id", id);
    renderCourseOutline(id);
  }
}

function goToExams(id) {
  let mainContainer = document.querySelector(".main-container");
  mainContainer.setAttribute("data-id", id);

  closePopup(".course-view-container");

  let popup = document.querySelector(".edit-course-container");
  popup.style.display = "flex";
  fetchAllExam(id);

  // fetchCourseWithIDForExam(id);
}

async function fetchCourseWithIDForExam(givenID) {
  let courseGridContainer = findElement(".course-view-container");
  let loader = `
      <div class="loader">
          <div class="sk-chase">
              <div class="sk-chase-dot"></div>
              <div class="sk-chase-dot"></div>
              <div class="sk-chase-dot"></div>
              <div class="sk-chase-dot"></div>
              <div class="sk-chase-dot"></div>
              <div class="sk-chase-dot"></div>
          </div>
      </div>`;

  courseGridContainer.innerHTML = loader;

  let courses = await getCourseDetails(givenID);

  if (courses.length > 0) if (courses[0].status == "error") return;

  let selectedCourse = courses[0];

  (function sortCourses(course) {
    course.lectures.sort((firstLecture, secondLecture) => {
      firstLecture.subtopics.sort(
        (firstSubtopic, secondSubtopic) =>
          firstSubtopic.hierarchy - secondSubtopic.hierarchy
      );

      return firstLecture.hierarchy - secondLecture.hierarchy;
    });
  })(selectedCourse);

  setTimeout(() => {
    let course = new Course(selectedCourse);
    course.renderTitle();
    course.renderCourseCode();
    course.renderDeleteButton(deleteButton);
    course.renderEditLearningObjectivesButton();
    course.renderLectureSection();

    findElement("#addNewLecture").addEventListener("click", () => {
      course.addLectureElement();
    });

    findElement("#saveCourseDetails").addEventListener("click", async () => {
      courseItemObjectLooper(course);
    });

    findElement("#excelCourseFileUpload").addEventListener(
      "change",
      async (event) => {
        console.log("clickeddddd");

        try {
          let file = event.target.files[0];
          const objectURL = window.URL.createObjectURL(file);
          let result = await parseExcelForCourseObject(objectURL);
          course.markAllForDeletion();
          course.eraseForExcelUpload(result);
          findElement("#excelCourseFileUpload").value = "";
        } catch (error) {
          console.log(error);
        }
      }
    );
  }, 2000);
}


function openExamModalTeacher() {
  var modal = document.getElementById("exam-modal");
  modal.style.display = "block";
}

function closeExamModalTeacher() {
  var modal = document.getElementById("exam-modal");
  modal.style.display = "none";
}

async function openExamModal(exam) {

  let examGradeID = uniqueID(1);

  let examID = exam.id;

  let { id: globalUserID } = await globalUserDetails;

  let timeStarted = Date.now();

  let status = "Started";

  await AJAXCall({
    phpFilePath: "../include/exam/addNewExamGrade.php",
    rejectMessage: "Add New Exam Grade file failed",
    params: `id=${examGradeID}&&userID=${globalUserID}&&examID=${examID}&&status=${status}&&timeStarted=${timeStarted}`,
    type: "post",
  });

  var modal = document.getElementById("exam-modal");
  modal.style.display = "block";

  const result = await AJAXCall({
    phpFilePath: "../include/readJSONData.php",
    rejectMessage: "saving json file failed",
    params: `filepath=../exam/generated/${exam.filename}`,
    type: "post",
  });

  const questions = JSON.parse(result);

  let questionsAsString = "";
  const studentExamModalContent = document.getElementById(
    "student-exam-modal-content"
  );

  studentExamModalContent.setAttribute("examGradeID", examGradeID);

  studentExamModalContent.innerHTML = "";

  for (let i = 0; i < questions.length; i++) {
    questionsAsString += `
    <div class="exam-question">
    <h4 class="exam-question-title">Question ${i + 1}</h4>
    <p style="margin-top:10px"> ${questions[i].question}</p>
    `;
    if (questions[i].answerOptions) {
      if (questions[i].answerOptions.length === 4) {
        questionsAsString += `
        <div>
        
        
      
        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:10px" >
        <p> A) ${questions[i].answerOptions[0]}</p>
        <p> B) ${questions[i].answerOptions[1]}</p>
        <p> C) ${questions[i].answerOptions[2]}</p>
        <p> D) ${questions[i].answerOptions[3]}</p>
        </div>
        <input type="text" required class="student-question-answer" placeholder="Enter answer here" />
        </div>
        `;
      } else {
        questionsAsString += `
            <div>
            <div style="display:flex;justify-content:flex-start;align-items:center;margin-top:10px" >
            <p> A) ${questions[i].answerOptions[0]}</p>
            <p style="margin-left:30px"> B) ${questions[i].answerOptions[1]}</p>
            </div>
            <input type="text" required class="student-question-answer" placeholder="Enter answer here" />
            </div>
           `;
      }
    } else {
      questionsAsString += `
      <div>
      <input type="text" required class="student-question-answer" placeholder="Enter answer here" />
      </div>
     `;
    }

    questionsAsString += `</div>`;
  }

  const defaultModal = `<span id="student-exam-modal-close" class="student-exam-modal-close" onclick="closeExamModal()">&times;</span>
<h3>Remained Exam <strong>${exam.minutes}</strong>  Minutes</h3>
<h3 class="exam-modal-title">Please solve your exam!</h3>
<div class="student-exam-modal-container" style="margin-top:10px;">
  
    ${questionsAsString}

    <div style="display:flex;justify-content:center;align-items:center;cursor:pointer">
        <button class="exam-modal-generate-button" style="cursor:pointer" >Send</button>
    </div>`;

  studentExamModalContent.innerHTML = defaultModal;
}

async function saveExamGrade(e) {
  e.preventDefault();
  let filename = `Exam-Grade-${uniqueID(2)}.json`;

  const answersOfQuestions = document.getElementsByClassName(
    "student-question-answer"
  );

  let answerJSON = [];
  for (let i = 0; i < answersOfQuestions.length; i++) {
    answerJSON.push({
      question: i + 1,
      answer: answersOfQuestions[i].value,
    });
  }

  let JSONString = JSON.stringify(answerJSON);

  let correctPath = `../exam/grades/${filename}`;

  await AJAXCall({
    phpFilePath: "../include/saveJSONData.php",
    rejectMessage: "saving json file failed",
    params: `filepath=${correctPath}&&jsonString=${JSONString}`,
    type: "post",
  });

  const studentExamModalContent = document.getElementById(
    "student-exam-modal-content"
  );

  let examGradeID = studentExamModalContent.getAttribute("examGradeID");

  let timeEnded = Date.now();
  let status = "Done";

  // TODO: We have to this mark situation
  let value = "3";

  let resultOfSaveExam = await AJAXCall({
    phpFilePath: "../include/exam/updateNewExamGrade.php",
    rejectMessage: "Update New Exam Grade file failed",
    params: `id=${examGradeID}&&filename=${filename}&&status=${status}&&value=${value}&&timeEnded=${timeEnded}`,
    type: "post",
  });

  animateDialog("You successfully send your exam");

  var modal = document.getElementById("exam-modal");
  modal.style.display = "none";
}

function closeExamModal() {
  let options = {
    title: "Are You Sure You Want To Leave Exam?",
    denyTitle: "No",
    acceptTitle: "Yes",
  };

  showOptionsDialog(options, async () => {
    var modal = document.getElementById("exam-modal");
    modal.style.display = "none";

    const studentExamModalContent = document.getElementById(
      "student-exam-modal-content"
    );

    let examGradeID = studentExamModalContent.getAttribute("examGradeID");

    let timeEnded = Date.now();
    let status = "Exam Failed";

    let filename = "";

    let value = "0";

    await AJAXCall({
      phpFilePath: "../include/exam/updateNewExamGrade.php",
      rejectMessage: "Update New Exam Grade file failed",
      params: `id=${examGradeID}&&filename=${filename}&&status=${status}&&value=${value}&&timeEnded=${timeEnded}`,
      type: "post",
    });
  });
}

async function generateExam(e) {
  e.preventDefault();

  const trueFalse = document.getElementById("exam-true-false-input");
  const examName = document.getElementById("exam-name-input");
  const multipleChoices = document.getElementById(
    "exam-multiple-choices-input"
  );
  const matching = document.getElementById("exam-matching-input");
  const fillInBlank = document.getElementById("exam-fill-in-blank-input");
  const examMinutes = document.getElementById("exam-minutes-input");
  const examDate = document.getElementById("exam-date-input");
  let mainContainer = document.querySelector(".main-container");
  const courseID = mainContainer.getAttribute("data-id");

  const easyInput = document.getElementById("exam-easy-input");
  const mediumInput = document.getElementById("exam-medium-input");
  const hardInput = document.getElementById("exam-hard-input");

  let loader = loadLoader("Generating Exam");

  const result = await getCourseDetails(courseID);

  let subtopicTitles = [];

  result.forEach((course) => {
    course.lectures.forEach((lecture) => {
      lecture.subtopics.forEach((subtopic) => {
        subtopicTitles.push(subtopic.title);
      });
    });
  });

  const subtopicString = subtopicTitles.join(", ");

  let language = "turkish"; //TODO: Toggle option.
  let topic = subtopicString;
  let educationEnvironment = "college students";

  //TODO: question count is going to 9 and not the intended maximum
  let multipleChoiceCount = multipleChoices.value; //10
  let fillInTheBlankCount = fillInBlank.value; //2
  let trueAndFalseCount = trueFalse.value; //5
  let matchingCount = matching.value; //5

  //TODO: figure out logic
  let hardQuestionsCount = hardInput.value;
  let mediumQuestionsCount = mediumInput.value;
  let easyQuestionsCount = easyInput.value;

  let query = `create for me in valid json format using ISO encoding,
    a series of new questions in the ${language} language as well as their answers
    in the ${language} language in the topics of ${topic}
    for ${educationEnvironment}.
    There should be ${multipleChoiceCount} choice questions
    with a minimum of 4 answers that do not include letters
    at the beginning.
    There should be ${matchingCount} matching questions, ${fillInTheBlankCount} fill in the blank questions and
    ${trueAndFalseCount} true and false questions with their answer options.
    ${hardQuestionsCount} of those questions should be hard,
    ${mediumQuestionsCount} should be medium and
    ${easyQuestionsCount} should be easy.
    The json format should have the following keys,
    "question, answerOptions, answer, type, hardness".
    The answerOptions should only be available if the
    question type is multiple choice or true and false.
    Do not add any invalid characters in the result.`;

  let unparsedJSONResponse = await generateGPTResponseFor(query);
  let questions = await JSON.parse(unparsedJSONResponse);
  console.log("questions amount: ", questions.questions.length);

  let filename = `Exam-${uniqueID(2)}.json`;
  saveExamAsJSON(filename, questions.questions, "generated");

  let examID = uniqueID(1);
  let dateGenerated = getCurrentTimeInJSONFormat();

  let params =
    `id=${examID}&&courseID=${courseID}&&examName=${examName.value}` +
    `&&dateGenerated=${dateGenerated}&&filename=${filename}&&minutes=${examMinutes.value}&&examDate=${examDate.value}&&amountOfTrueFalseQuestions=${trueAndFalseCount}&&amountOfMultipleChoicesQuestions=${multipleChoiceCount}&&amountOfMatchingQuestions=${matchingCount}&&amountOfFillInTheBlankQuestions=${fillInTheBlankCount}&&hardQuestionsCount=${hardQuestionsCount}&&mediumQuestionsCount=${mediumQuestionsCount}&&easyQuestionsCount=${easyQuestionsCount}&&courseCode=${result[0].courseCode}`;

  let response = await AJAXCall({
    phpFilePath: "../include/exam/addNewExam.php",
    rejectMessage: "New Exam Failed To Add",
    params,
    type: "post",
  });

  console.log("exam generation response: ", response);

  fetchAllExam(courseID);

  setTimeout(() => {
    closeExamModal();
    removeLoader(loader);
  }, 2000);
}

async function saveExamAsJSON(filename, ArrayContainingObjects, type) {
  let JSONString = JSON.stringify(ArrayContainingObjects);

  let correctPath;

  switch (type) {
    case "student":
    case "new":
    case "resume":
      correctPath = `../exam/taken/${filename}`;
      break;
    case "teacher":
    case "generated":
      correctPath = `../exam/generated/${filename}`;
      break;
  }

  console.log("[3] correctPath: ", correctPath);
  console.log("[4] jsonString: ", JSONString);

  try {
    let result = await AJAXCall({
      phpFilePath: "../include/saveJSONData.php",
      rejectMessage: "saving json file failed",
      params: `filepath=${correctPath}&&jsonString=${JSONString}`,
      type: "post",
    });

    console.log("[5] async Result: ", result);
  } catch (error) {
    //TODO: bubbleUpError()
    console.log(error);
  }
}

async function fetchAllExam(id) {
  const examResponse = await AJAXCall({
    phpFilePath: "../include/exam/getAllExam.php",
    rejectMessage: "Get All Exam Failed To Be Fetched",
    params: `courseID=${id}`,
    type: "fetch",
  });

  const examsContainer = document.getElementById("exams-container");
  examsContainer.innerHTML = "";

  for (let i = 0; i < examResponse.length; i++) {
    const newDiv = document.createElement("div");
    const newFirstP = document.createElement("p");
    const newSecondP = document.createElement("p");

    newDiv.className = "exam-item";

    newFirstP.innerHTML = examResponse[i].examName;
    newSecondP.innerHTML = examResponse[i].examDate;

    newDiv.appendChild(newFirstP);
    newDiv.appendChild(newSecondP);
    examsContainer.appendChild(newDiv);
  }

  if (examResponse.length === 0) {
    const newDiv = document.createElement("div");
    newDiv.className = "exam-item";
    newDiv.style = "display:flex; justify-content:center;align-items:center;";

    const newFirstP = document.createElement("p");

    newFirstP.innerHTML = "You did not create any exam!";
    newDiv.appendChild(newFirstP);
    examsContainer.appendChild(newDiv);
  }
}

async function getAllCoursesOfStudent() {

  let { id: globalUserID } = await getUserDetails();

  console.log("gus: ", globalUserID);

  const subscriptions = await AJAXCall({
    phpFilePath: "../include/exam/getAllSubscriptions.php",
    rejectMessage: "Get All Subscriptions Failed To Be Fetched",
    params: `userID=${globalUserID}`,
    type: "fetch",
  });

  const exams = [];

  for (let i = 0; i < subscriptions.length; i++) {
    const exam = await AJAXCall({
      phpFilePath: "../include/exam/getAllExamByCourseID.php",
      rejectMessage: "Get My Exams Failed To Be Fetched",
      params: `courseID=${subscriptions[i].courseID}`,
      type: "fetch",
    });

    exams.push(...exam);
  }

  console.log("exams: ", exams);

  const studentExamContainer = document.getElementById(
    "student-exam-container"
  );

  studentExamContainer.innerHTML = "";

  for (let i = 0; i < exams.length; i++) {
    const mainDiv = document.createElement("div");
    mainDiv.classList.add("course-card");
    mainDiv.onclick = () => openExamModal(exams[i]);

    const imgDiv = document.createElement("div");
    imgDiv.classList.add("course-card-image");
    const img = document.createElement("img");
    img.src = "../assets/images/courseDefault.jpg";
    imgDiv.appendChild(img);

    const cardTextDiv = document.createElement("div");
    cardTextDiv.classList.add("card-text");

    const courseCodeDiv = document.createElement("div");
    courseCodeDiv.classList.add("course-card-code");
    courseCodeDiv.textContent = exams[i].courseCode;

    const examNameDiv = document.createElement("div");
    examNameDiv.classList.add("course-card-title");
    examNameDiv.textContent = exams[i].examName;

    const examDateDiv = document.createElement("div");
    examDateDiv.classList.add("course-card-title");
    examDateDiv.textContent = exams[i].examDate;

    cardTextDiv.appendChild(courseCodeDiv);
    cardTextDiv.appendChild(examNameDiv);
    cardTextDiv.appendChild(examDateDiv);

    const cardOverlayDiv = document.createElement("div");
    cardOverlayDiv.classList.add("card-overlay");

    mainDiv.appendChild(imgDiv);
    mainDiv.appendChild(cardTextDiv);
    mainDiv.appendChild(cardOverlayDiv);

    studentExamContainer.appendChild(mainDiv);
  }
}
