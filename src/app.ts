type Validatable = {
    value: string | number;
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
};

type Project = {
    id: string;
    title: string;
    desc: string;
    people: number;
}

// Validator Function
function validate(input: Validatable) {
    let isValid = true;

    if (input.required) {
        isValid = isValid && input.value.toString().length > 0;
    }

    if (input.minLength != null && typeof input.value === "string") {
        isValid = isValid && input.value.length > input.minLength;
    }

    if (input.maxLength != null && typeof input.value === "string") {
        isValid = isValid && input.value.length < input.maxLength;
    }

    if (input.min != null && typeof input.value === "number") {
        isValid = isValid && input.value > input.min;
    }

    if (input.max != null && typeof input.value === "number") {
        isValid = isValid && input.value < input.max;
    }

    return isValid;
}

// Decorator to bind this
function BindThis(_target: any, _propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const newDescriptor: any = {
        // writable: true,
        enumerable: false,
        configurable: true,
        get() {
            const boundFn = originalMethod.bind(this)
            return boundFn;
        }
    }

    return newDescriptor;
}

// Singleton ProjectState Class

class ProjState {
    private listeners: any[] = [];
    private projects: Project[] = [];
    private static instance: ProjState;

    private constructor() {}

    addLisener(listener: Function) {
        this.listeners.push(listener);
    }

    addProject(title: string, desc: string, people: number) {
        const project = {
            id: Math.random().toString(),
            title,
            desc,
            people
        }
        this.projects.push(project);

        // Execute listeners after each added project
        for (const listenerFn of this.listeners) {
            listenerFn(this.projects.slice());
        }
    }

    static getInstance() {
        if (this.instance) {
            return this.instance;
        }
        this.instance = new ProjState();
        return this.instance;
    }
}

const projState = ProjState.getInstance();

// ProjectList Class
class ProjList {
    private porjListTemplate: HTMLTemplateElement;
    private mainElement: HTMLDivElement;
    private sectionElement: HTMLElement;

    private assignedProjects: any[];

    constructor(private type: 'active' | 'finished') {
        this.assignedProjects = [];
        this.porjListTemplate = document.querySelector("#project-list")! as HTMLTemplateElement;
        this.mainElement = document.querySelector("#app")! as HTMLDivElement;

        const importedNode = document.importNode(this.porjListTemplate.content, true);
        this.sectionElement = importedNode.firstElementChild as HTMLElement;

        this.sectionElement.id = `${this.type}-projects`;

        projState.addLisener((projects: any[]) => {
            this.assignedProjects = projects;
            this.renderProjects();
        });

        this.attach();
        this.renderList();
    }

    renderProjects() {
        const listEL = document.getElementById(`${this.type}-projects-list`)! as HTMLUListElement;
        for (const item of this.assignedProjects) {
            const listItem = document.createElement("li");
            listItem.textContent = item.title;
            listEL.append(listItem);
        }
    }

    renderList() {
        const projListHeading = this.sectionElement.querySelector("h2") as HTMLHeadingElement;
        const projListContent = this.sectionElement.querySelector("ul") as HTMLUListElement;

        projListHeading.textContent = `${this.type.toUpperCase()} PROJECTS`
        projListContent.id = `${this.type}-projects-list`;
    }

    attach() {
        this.mainElement.insertAdjacentElement("beforeend", this.sectionElement);
    }
}


// ProjectInput Class
class ProjInput {

    inputTemplate: HTMLTemplateElement;
    mainElement: HTMLDivElement;
    formElement: HTMLFormElement;
    titleInputEl: HTMLInputElement;
    descInputEl: HTMLInputElement;
    peopleInputEl: HTMLInputElement;

    constructor() {
        this.inputTemplate = document.querySelector("#project-input")! as HTMLTemplateElement;
        this.mainElement = document.querySelector("#app")! as HTMLDivElement;

        // Render main input form
        const importedNode = document.importNode(this.inputTemplate.content, true);
        this.formElement = importedNode.firstElementChild as HTMLFormElement;
        this.formElement.id = "user-input";

        // Select input elements
        this.titleInputEl = this.formElement.querySelector("#title") as HTMLInputElement;
        this.descInputEl = this.formElement.querySelector("#description") as HTMLInputElement;
        this.peopleInputEl = this.formElement.querySelector("#people") as HTMLInputElement;

        // Configure & Attach
        this.configure();
        this.attach();
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
            minLength: 4
        }

        const validatableDesc: Validatable = {
            value: desc,
            required: true,
            minLength: 9
        }

        const validatablePeople: Validatable = {
            value: +people,
            required: true,
            min: 0
        }

        if (!validate(validatableTitle) || !validate(validatableDesc) || !validate(validatablePeople))
            return alert("Invalid inputs!");

        return [title, desc, +people];
    }

    clearInputs() {
        this.titleInputEl.value = "";
        this.descInputEl.value = "";
        this.peopleInputEl.value = "";
    }

    @BindThis
    private submitHandler(event: Event) {
        event.preventDefault();
        const inputs = this.getUserInputs()

        if (Array.isArray(inputs)) {
            const [title, desc, people] = inputs;
            console.log(title, desc, people);
            projState.addProject(title, desc, people);
            this.clearInputs();
        }
    }

    private configure() {
        this.formElement.addEventListener("submit", this.submitHandler);
    }

    private attach() {
        this.mainElement.prepend(this.formElement);
    }
}

// Instantiate project input
const projInput = new ProjInput();

// Instantiate project list
const activeProjList = new ProjList("active");
const finishedProjList = new ProjList("finished");

