// Type defintions
type Validatable = {
    value: string | number;
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
};

type listener<T> = (x: T[]) => void;

enum projStatus {
    active, finished
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

// Project Class
class Project {
    public id: string;
    constructor(public title: string, public desc: string, public people: number, public status: projStatus) {
        this.id = Math.random().toString();
    }
}

// Singleton ProjectState Class

class State<T> {
    protected listeners: listener<T>[] = [];

    addLisener(listener: listener<T>) {
        this.listeners.push(listener);
    }
}

class ProjState extends State<Project> {
    private projects: Project[] = [];
    private static instance: ProjState;

    private constructor() {
        super();
    }

    addProject(title: string, desc: string, people: number) {
        const project = new Project(title, desc, people, projStatus.active);
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

// Project Component Class
abstract class Component<T extends HTMLElement, U extends HTMLElement> {
    private porjListTemplate: HTMLTemplateElement;
    protected mainElement: T;
    protected element: U;

    constructor(templateId: string, mainId: string, insertAtBegin: boolean, elementId?: string) {
        this.porjListTemplate = document.getElementById(templateId)! as HTMLTemplateElement;
        this.mainElement = document.getElementById(mainId)! as T;

        const importedNode = document.importNode(this.porjListTemplate.content, true);
        
        this.element = importedNode.firstElementChild as U;

        if (elementId) {
            this.element.id = elementId;
        }

        this.attach(insertAtBegin)
    }

    attach(insertAtBegin: boolean) {
        this.mainElement.insertAdjacentElement(insertAtBegin ? "afterbegin" : "beforeend", this.element);
    }

    abstract configure(): void;
    abstract renderContent(): void;
}

// ProjItem Class
class ProjItem extends Component<HTMLUListElement, HTMLLIElement> {
    private project: Project;
    constructor(mainId: string, project: Project) {
        super("single-project", mainId, false, project.id);
        this.project = project;

        this.renderContent()
    }

    configure(): void {
        throw new Error("Method not implemented.");
    }
    renderContent(): void {
        this.element.querySelector("h2")!.textContent = this.project.title;
        this.element.querySelector("h3")!.textContent = this.project.people.toString();
        this.element.querySelector("p")!.textContent = this.project.desc;
    }
    
}

// ProjectList Class
class ProjList extends Component<HTMLDivElement, HTMLElement> {
    private assignedProjects: any[];

    constructor(private type: 'active' | 'finished') {
        super("project-list", "app", false, `${type}-projects`);
        this.assignedProjects = [];    

        this.configure();
        this.renderContent();
    }

    renderProjects() {
        const listEL = document.getElementById(`${this.type}-projects-list`)! as HTMLUListElement;
        listEL.innerHTML = "";
        for (const project of this.assignedProjects) {
            new ProjItem(this.element.querySelector("ul")!.id, project);
        }
    }

    renderContent() {
        const projListHeading = this.element.querySelector("h2") as HTMLHeadingElement;
        const projListContent = this.element.querySelector("ul") as HTMLUListElement;

        projListHeading.textContent = `${this.type.toUpperCase()} PROJECTS`
        projListContent.id = `${this.type}-projects-list`;
    }

    configure(): void {
        projState.addLisener((projects: Project[]) => {
            const relevantProjects = projects.filter(p => {
                if (this.type === "active") {
                    return p.status === projStatus.active
                }
                return p.status === projStatus.finished
            });

            this.assignedProjects = relevantProjects;
            
            this.renderProjects();
        });
    }
}


// ProjectInput Class
class ProjInput extends Component<HTMLDivElement, HTMLFormElement> {
    titleInputEl: HTMLInputElement;
    descInputEl: HTMLInputElement;
    peopleInputEl: HTMLInputElement;

    constructor() {
        super("project-input", "app", true, "user-input")

        // Select input elements
        this.titleInputEl = this.element.querySelector("#title") as HTMLInputElement;
        this.descInputEl = this.element.querySelector("#description") as HTMLInputElement;
        this.peopleInputEl = this.element.querySelector("#people") as HTMLInputElement;


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

    renderContent(): void {}

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

    configure() {
        this.element.addEventListener("submit", this.submitHandler);
    }
}

// Instantiate project input
const projInput = new ProjInput();

// Instantiate project list
const activeProjList = new ProjList("active");
const finishedProjList = new ProjList("finished");

