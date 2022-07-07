import { BindThis } from "../decorators/bind-this.js";
import { Validatable } from "../models/type-definitions.js";
import { projState } from "../state/project-state.js";
import { validate } from "../utils/validator.js";
import { Component } from "./main-component.js";

export class ProjInput extends Component<HTMLDivElement, HTMLFormElement> {
    titleInputEl: HTMLInputElement;
    descInputEl: HTMLInputElement;
    peopleInputEl: HTMLInputElement;
  
    constructor() {
      super("project-input", "app", true, "user-input");
  
      // Select input elements
      this.titleInputEl = this.element.querySelector(
        "#title"
      ) as HTMLInputElement;
      this.descInputEl = this.element.querySelector(
        "#description"
      ) as HTMLInputElement;
      this.peopleInputEl = this.element.querySelector(
        "#people"
      ) as HTMLInputElement;
  
      // Configure
      this.configure();
    }
  
    getUserInputs(): [string, string, number] | void {
      // Extract inputs values
      const title = this.titleInputEl.value;
      const desc = this.descInputEl.value;
      const people = this.peopleInputEl.value;
  
      // Create Validatable objects
      const validatableTitle: Validatable = {
        value: title,
        required: true,
        minLength: 4,
      };
  
      const validatableDesc: Validatable = {
        value: desc,
        required: true,
        minLength: 9,
      };
  
      const validatablePeople: Validatable = {
        value: +people,
        required: true,
        min: 0,
      };
  
      if (
        !validate(validatableTitle) ||
        !validate(validatableDesc) ||
        !validate(validatablePeople)
      )
        return alert("Invalid inputs!");
  
      return [title, desc, +people];
    }
  
    renderContent(): void {}
  
    clearInputs() {
      this.titleInputEl.value = "";
      this.descInputEl.value = "";
      this.peopleInputEl.value = "";
    }
  
    @BindThis
    private submitHandler(event: Event) {
      event.preventDefault();
      const inputs = this.getUserInputs();
  
      if (Array.isArray(inputs)) {
        const [title, desc, people] = inputs;
        projState.addProject(title, desc, people);
        this.clearInputs();
      }
    }
  
    configure() {
      this.element.addEventListener("submit", this.submitHandler);
    }
  }