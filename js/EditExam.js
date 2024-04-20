class EditExam {
  filename;
  minimumExamNumber = 0;
  maximumExamNumber = 0;
  currentExamNumber = 0;
  questions = [];
  nextButton;
  previousButton;
  saveButton;
  type;

  renderQuestionNumber(questionNumber) {
    let questionNumberElement = document.querySelector(".question-header");
    questionNumberElement.innerHTML = "";
    let questionTextElement = createLocalizedTextElement("Question");
    let numberElement = document.createElement("div");
    numberElement.textContent = questionNumber + 1;
    questionNumberElement.appendChild(questionTextElement);
    questionNumberElement.appendChild(numberElement);
  }

  constructor(questions, type, filename) {
    this.filename = filename;
    this.questions = questions;
    this.maximumExamNumber = questions.length - 1;
    this.type = type;

    console.log("[1] filename: ", filename);
  }

  startEdittingExam() {
    this.renderQuestion();
  }

  saveExam() {
    saveExamAsJSON(this.filename, this.questions, this.type);
  }

  renderQuestion() {
    this.renderQuestionNumber(this.currentExamNumber);
    this.questions[this.currentExamNumber].render();
  }

  nextQuestion() {
    ++this.currentExamNumber;
    this.handleButtons();
    this.renderQuestion();
  }

  previousQuestion() {
    --this.currentExamNumber;
    this.handleButtons();
    this.renderQuestion();
  }

  setPreviousButton(button) {
    this.previousButton = button;
    this.previousButton.addEventListener("click", () => {
      this.previousQuestion();
    });
  }

  setNextButton(button) {
    this.nextButton = button;
    this.nextButton.addEventListener("click", () => {
      this.nextQuestion();
    });
  }

  setSaveButton(button) {
    this.saveButton = button;
    this.saveButton.addEventListener("click", () => {
      this.saveExam();
      closePopup(".edit-quiz-overlay");
    });
  }

  handleButtons() {
    // this.autoSave();

    if (this.currentExamNumber == 0) {
      this.nextButton.removeAttribute("disabled");
      this.previousButton.setAttribute("disabled", "true");
    }

    if (
      this.currentExamNumber > 0 &&
      this.currentExamNumber <= this.maximumExamNumber
    ) {
      this.nextButton.removeAttribute("disabled");
      this.previousButton.removeAttribute("disabled");
    }

    if (this.currentExamNumber == this.maximumExamNumber) {
      this.nextButton.setAttribute("disabled", "true");
    }
  }
}

class QuestionForExam {
  id;
  question;
  answerOptions;
  answer;
  type;
  inputAnswer;
  hardness;
  marksWorth;
  lockedQuestion;
  lockedAnswer;

  constructor(questionObject) {
    let {
      question,
      answerOptions,
      answer,
      type,
      hardness,
      lockedQuestion,
      lockedAnswer,
    } = questionObject;

    this.id = uniqueID(1);
    this.question = question;
    this.answerOptions = answerOptions;
    this.answer = answer;
    this.type = type;
    this.hardness = hardness;
    this.lockedQuestion = lockedQuestion ?? false;
    this.lockedAnswer = lockedAnswer ?? false;

    if (questionObject.inputAnswer != null)
      this.inputAnswer = questionObject.inputAnswer;
  }

  //TODO: refactor out this function ...
  renderQuizArea(...quizAreaElements) {
    let quizArea = document.querySelector(".question-area");
    quizArea.innerHTML = "";
    quizAreaElements.forEach((element) => quizArea.appendChild(element));
  }
}

class EditMultipleChoiceForExam extends QuestionForExam {
  constructor(questionObject, marksWorth = 1) {
    // randomize answer options
    super(questionObject);
    this.marksWorth = marksWorth;
  }

  render() {
    let questionMainDiv = document.createElement("div");
    let answerMainDiv = document.createElement("div");

    let question = document.createElement("div");
    question.setAttribute("contentEditable", "true");
    question.className = "question editable";
    question.textContent = this.question;

    question.addEventListener("input", (event) => {
      this.question = event.target.textContent;
    });

    const lockContainerQuestion = document.createElement("div");
    lockContainerQuestion.classList.add("tooltip-container");

    const lockSelectQuestion = document.createElement("select");
    lockSelectQuestion.classList.add("tooltip-target");

    lockSelectQuestion.addEventListener("change", () => {
      this.lockedQuestion = lockSelectQuestion.value;
    });

    const currentLanguages = [
      { lang: "Turkish" },
      { lang: "English" },
      { lang: "Russian" },
      { lang: "Ukrainian" },
    ];

    for (let i = 0; i < currentLanguages.length; i++) {
      const questionLock = document.createElement("option");
      questionLock.textContent = currentLanguages[i].lang;
      questionLock.value = currentLanguages[i].lang;
      lockSelectQuestion.appendChild(questionLock);
    }
    lockSelectQuestion.value = this.lockedQuestion;

    lockContainerQuestion.appendChild(lockSelectQuestion);

    const lockContainerAnswer = document.createElement("div");
    lockContainerAnswer.classList.add("tooltip-container");

    const lockSelectAnswer = document.createElement("select");
    lockSelectAnswer.classList.add("tooltip-target");

    lockSelectAnswer.addEventListener("change", () => {
      this.lockedAnswer = lockSelectAnswer.value;
    });

    for (let i = 0; i < currentLanguages.length; i++) {
      const answerLock = document.createElement("option");
      answerLock.textContent = currentLanguages[i].lang;
      answerLock.value = currentLanguages[i].lang;
      lockSelectAnswer.appendChild(answerLock);
    }
    lockSelectAnswer.value = this.lockedAnswer;

    lockContainerAnswer.appendChild(lockSelectAnswer);

    let answerOptionsList = document.createElement("div");
    answerOptionsList.className = "answer-options-list";

    let answerOptionMap = this.answerOptions.map((option, index) => {
      let answerOptionContainer = document.createElement("div");

      if (this.inputAnswer == this.answerOptions[index]) {
        answerOptionContainer.className = "answer-option-container active";
      } else {
        answerOptionContainer.className = "answer-option-container";
      }

      let letterOption = document.createElement("div");
      letterOption.className = "letter-option";
      letterOption.textContent = letters[index];

      let answerOption = document.createElement("div");
      answerOption.setAttribute("contentEditable", "true");
      answerOption.className = "answer-option editable";
      answerOption.textContent = option;

      answerOption.addEventListener("input", (event) => {
        this.answerOptions[index] = event.target.textContent;
      });

      answerOptionContainer.addEventListener("click", () => {
        disableOtherOptions();
        answerOptionContainer.className = "answer-option-container active";
      });

      //TODO: have an option to select the correct answer, or show the
      // correct answer

      answerOptionContainer.appendChild(letterOption);
      answerOptionContainer.appendChild(answerOption);
      answerOptionsList.appendChild(answerOptionContainer);
      return answerOptionContainer;
    });

    let letterOption = document.createElement("div");
    letterOption.className = "letter-option";
    letterOption.style = "width:100px";
    letterOption.textContent = "Answer";

    let answerOption = document.createElement("div");
    answerOption.setAttribute("contentEditable", "true");
    answerOption.className = "answer-option editable";
    answerOption.textContent = this.answer;

    answerOption.addEventListener("input", (event) => {
      this.answer = event.target.textContent;
    });

    let answerOptionContainer = document.createElement("div");

    answerOptionContainer.className = "answer-option-container";

    answerOptionContainer.addEventListener("click", () => {
      disableOtherOptions();
      answerOptionContainer.className = "answer-option-container active";
    });

    answerOptionContainer.appendChild(letterOption);
    answerOptionContainer.appendChild(answerOption);
    answerOptionsList.appendChild(answerOptionContainer);

    function disableOtherOptions() {
      answerOptionMap.forEach(
        (option) => (option.className = "answer-option-container")
      );
    }

    questionMainDiv.appendChild(lockContainerQuestion);
    questionMainDiv.appendChild(question);

    answerMainDiv.appendChild(lockContainerAnswer);
    answerMainDiv.appendChild(answerOptionsList);

    super.renderQuizArea(questionMainDiv, answerMainDiv);
  }
}

class EditTrueAndFalseExam extends QuestionForExam {
  constructor(questionObject, marksWorth = 1) {
    super(questionObject);
    this.marksWorth = marksWorth;
  }

  render() {
    let questionMainDiv = document.createElement("div");
    let answerMainDiv = document.createElement("div");

    let question = document.createElement("div");
    question.setAttribute("contentEditable", "true");
    question.className = "question editable";
    question.textContent = this.question;

    question.addEventListener("input", (event) => {
      this.question = event.target.textContent;
    });

    const lockContainerQuestion = document.createElement("div");
    lockContainerQuestion.classList.add("tooltip-container");

    const lockSelectQuestion = document.createElement("select");
    lockSelectQuestion.classList.add("tooltip-target");

    lockSelectQuestion.addEventListener("change", () => {
      this.lockedQuestion = lockSelectQuestion.value;
    });

    const currentLanguages = [
      { lang: "Turkish" },
      { lang: "English" },
      { lang: "Russian" },
      { lang: "Ukrainian" },
    ];

    for (let i = 0; i < currentLanguages.length; i++) {
      const questionLock = document.createElement("option");
      questionLock.textContent = currentLanguages[i].lang;
      questionLock.value = currentLanguages[i].lang;
      lockSelectQuestion.appendChild(questionLock);
    }
    lockSelectQuestion.value = this.lockedQuestion;

    lockContainerQuestion.appendChild(lockSelectQuestion);

    const lockContainerAnswer = document.createElement("div");
    lockContainerAnswer.classList.add("tooltip-container");

    const lockSelectAnswer = document.createElement("select");
    lockSelectAnswer.classList.add("tooltip-target");

    lockSelectAnswer.addEventListener("change", () => {
      this.lockedAnswer = lockSelectAnswer.value;
    });

    for (let i = 0; i < currentLanguages.length; i++) {
      const answerLock = document.createElement("option");
      answerLock.textContent = currentLanguages[i].lang;
      answerLock.value = currentLanguages[i].lang;
      lockSelectAnswer.appendChild(answerLock);
    }
    lockSelectAnswer.value = this.lockedAnswer;

    lockContainerAnswer.appendChild(lockSelectAnswer);

    let answerOptions = this.answerOptions || [];

    // There are bugs here. What if the teacher wants to edit???
    if (this.answerOptions.length == 0) {
      switch (this.answer) {
        case "Yes":
          answerOptions = ["Yes", "No"]; //TODO: Match for other languages
          break;
        case "True":
          answerOptions = ["True", "False"];
          break;
        case "False":
          answerOptions = ["True", "False"];
          break;
        case "No":
          answerOptions = ["Yes", "No"];
          break;
      }
    }

    let answerOptionsList = document.createElement("div");
    answerOptionsList.className = "tf-options-list";

    let answerOptionMap = answerOptions.map((option, index) => {
      let answerOptionContainer = document.createElement("div");
      answerOptionContainer.className = "tf-answer-option-container";

      let answerOption = document.createElement("div");
      answerOption.textContent = option;

      if (this.answer == answerOptions[index]) {
        answerOption.className = "button tf-answer-option active";
      } else {
        answerOption.className = "button tf-answer-option";
      }

      answerOption.addEventListener("click", () => {
        disableOtherOptions();
        answerOption.className = "button tf-answer-option active";

        this.answer = option;
      });

      answerOptionContainer.appendChild(answerOption);
      answerOptionsList.appendChild(answerOptionContainer);
      return answerOption;
    });

    function disableOtherOptions() {
      answerOptionMap.forEach(
        (option) => (option.className = "button tf-answer-option")
      );
    }

    questionMainDiv.appendChild(lockContainerQuestion);
    questionMainDiv.appendChild(question);
    answerMainDiv.appendChild(lockContainerAnswer);
    answerMainDiv.appendChild(answerOptionsList);

    super.renderQuizArea(questionMainDiv, answerMainDiv);
  }
}

class EditFillInTheBlankExam extends QuestionForExam {
  constructor(questionObject, marksWorth = 1) {
    super(questionObject);
    this.marksWorth = marksWorth;
  }

  render() {
    let questionMainDiv = document.createElement("div");
    let answerMainDiv = document.createElement("div");

    let question = document.createElement("div");
    question.setAttribute("contentEditable", "true");
    question.className = "question editable";
    question.textContent = this.question;

    question.addEventListener("input", (event) => {
      this.question = event.target.textContent;
    });

    const lockContainerQuestion = document.createElement("div");
    lockContainerQuestion.classList.add("tooltip-container");

    const lockSelectQuestion = document.createElement("select");
    lockSelectQuestion.classList.add("tooltip-target");

    lockSelectQuestion.addEventListener("change", () => {
      this.lockedQuestion = lockSelectQuestion.value;
    });

    const currentLanguages = [
      { lang: "Turkish" },
      { lang: "English" },
      { lang: "Russian" },
      { lang: "Ukrainian" },
    ];

    for (let i = 0; i < currentLanguages.length; i++) {
      const questionLock = document.createElement("option");
      questionLock.textContent = currentLanguages[i].lang;
      questionLock.value = currentLanguages[i].lang;
      lockSelectQuestion.appendChild(questionLock);
    }
    lockSelectQuestion.value = this.lockedQuestion;

    lockContainerQuestion.appendChild(lockSelectQuestion);

    const lockContainerAnswer = document.createElement("div");
    lockContainerAnswer.classList.add("tooltip-container");

    const lockSelectAnswer = document.createElement("select");
    lockSelectAnswer.classList.add("tooltip-target");

    lockSelectAnswer.addEventListener("change", () => {
      this.lockedAnswer = lockSelectAnswer.value;
    });

    for (let i = 0; i < currentLanguages.length; i++) {
      const answerLock = document.createElement("option");
      answerLock.textContent = currentLanguages[i].lang;
      answerLock.value = currentLanguages[i].lang;
      lockSelectAnswer.appendChild(answerLock);
    }
    lockSelectAnswer.value = this.lockedAnswer;

    lockContainerAnswer.appendChild(lockSelectAnswer);

    let blankTextContainer = document.createElement("div");
    blankTextContainer.className = "fitb-answer-option-container";

    let blankTextEditableField = document.createElement("input");
    blankTextEditableField.className = "fitb-answer-input";
    blankTextEditableField.placeholder = "Enter You Answer Here";

    if (this.answer) {
      blankTextEditableField.className = "fitb-answer-input active";
      blankTextEditableField.value = this.answer;
    }

    blankTextEditableField.addEventListener("input", () => {
      blankTextEditableField.className = "fitb-answer-input active";
      this.answer = blankTextEditableField.value;
    });

    blankTextContainer.appendChild(blankTextEditableField);

    questionMainDiv.appendChild(lockContainerQuestion);
    questionMainDiv.appendChild(question);
    answerMainDiv.appendChild(lockContainerAnswer);
    answerMainDiv.appendChild(blankTextContainer);

    super.renderQuizArea(questionMainDiv, answerMainDiv);
  }
}

async function startEditingExam(filename, type = "teacher") {
  let correctPath = `../exam/generated/${filename}`;
  console.log("correctPath:", correctPath);

  let examFileResponse = await fetch(correctPath, { cache: "reload" });
  console.log("examFileResponse:", examFileResponse);

  let questions = await examFileResponse.json();

  let questionsArray = questions.map((question) => {
    switch (question.type.toLowerCase()) {
      case "mcq":
      case "multiple choice":
      case "multiple choice question":
        return new EditMultipleChoiceForExam(question);
      case "true and false":
      case "t and f":
      case "t/f":
      case "true/false":
      case "true-false":
      case "t-f":
        return new EditTrueAndFalseExam(question);
      case "fill in the blank":
        return new EditFillInTheBlankExam(question);
      case "matching":
        return new EditFillInTheBlankExam(question);
      default:
        throw new Error("Not Made Yet");
    }
  });

  // console.log("qa: ", questionsArray);

  let exam = new EditExam(questionsArray, type, filename);

  let editExamOverlay = document.querySelector(".edit-quiz-overlay");
  let previousButton = editExamOverlay.querySelector(".previous-question");
  let nextButton = editExamOverlay.querySelector(".next-question");
  let saveButton = editExamOverlay.querySelector(".save-button");

  previousButton = clearEventListenersFor(previousButton);
  nextButton = clearEventListenersFor(nextButton);
  saveButton = clearEventListenersFor(saveButton);

  exam.setNextButton(nextButton);
  exam.setPreviousButton(previousButton);
  exam.setSaveButton(saveButton);

  exam.startEdittingExam();
  openPopup(".edit-quiz-overlay");
}