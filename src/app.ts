// Type defintions
type Validatable = {
  value: string | number;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
};

type Listener<T> = (x: T[]) => void;

enum ProjStatus {
  active,
  finished,
}

// Drag Interfaces
interface Draggable {
  dragStartHandler(event: DragEvent): void;
  dragEndHandler(event: DragEvent): void;
}

interface DragTarget {
  dragOverHandler(event: DragEvent): void;
  dropHandler(event: DragEvent): void;
  dragLeaveHandler(event: DragEvent): void;
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
function BindThis(
  _target: any,
  _propertyKey: string,
  descriptor: PropertyDescriptor
) {
  const originalMethod = descriptor.value;
  const newDescriptor: any = {
    // writable: true,
    enumerable: false,
    configurable: true,
    get() {
      const boundFn = originalMethod.bind(this);
      return boundFn;
    },
  };

  return newDescriptor;
}

// Project Class
class Project {
  public id: string;
  constructor(
    public title: string,
    public desc: string,
    public people: number,
    public status: ProjStatus
  ) {
    this.id = Math.random().toString();
  }
}

// Singleton ProjectState Class

class State<T> {
  protected listeners: Listener<T>[] = [];

  addLisener(listener: Listener<T>) {
    this.listeners.push(listener);
  }
}

class ProjState extends State<Project> {
  private projects: Project[] = [];
  private static instance: ProjState;

  private constructor() {
    super();
  }

  static getInstance() {
    if (this.instance) {
      return this.instance;
    }
    this.instance = new ProjState();
    return this.instance;
  }

  addProject(title: string, desc: string, people: number) {
    const project = new Project(title, desc, people, ProjStatus.active);
    this.projects.push(project);

    // Execute listeners after each added project
    this.updateListeners();
  }

  moveProject(projId: string, newStatus: ProjStatus) {
    const project = this.projects.find((P) => P.id === projId);

    if (project && project.status !== newStatus) {
      project.status = newStatus;
      this.updateListeners();
    }
  }

  updateListeners() {
    for (const listenerFn of this.listeners) {
      listenerFn(this.projects.slice());
    }
  }
}

// Project Component Class
abstract class Component<T extends HTMLElement, U extends HTMLElement> {
  private porjListTemplate: HTMLTemplateElement;
  protected mainElement: T;
  protected element: U;

  constructor(
    templateId: string,
    mainId: string,
    insertAtBegin: boolean,
    elementId?: string
  ) {
    this.porjListTemplate = document.getElementById(
      templateId
    )! as HTMLTemplateElement;
    this.mainElement = document.getElementById(mainId)! as T;

    const importedNode = document.importNode(
      this.porjListTemplate.content,
      true
    );

    this.element = importedNode.firstElementChild as U;

    if (elementId) {
      this.element.id = elementId;
    }

    this.attach(insertAtBegin);
  }

  attach(insertAtBegin: boolean) {
    this.mainElement.insertAdjacentElement(
      insertAtBegin ? "afterbegin" : "beforeend",
      this.element
    );
  }

  abstract configure(): void;
  abstract renderContent(): void;
}

// ProjItem Class
class ProjItem
  extends Component<HTMLUListElement, HTMLLIElement>
  implements Draggable
{
  private project: Project;

  get persons() {
    if (this.project.people === 1) {
      return "1 person";
    }
    return `${this.project.people} persons`;
  }
  constructor(mainId: string, project: Project) {
    super("single-project", mainId, false, project.id);
    this.project = project;

    this.configure();
    this.renderContent();
  }

  @BindThis
  dragStartHandler(event: DragEvent): void {
    event.dataTransfer!.setData("text/plain", this.project.id);
    event.dataTransfer!.effectAllowed = "move";
  }

  @BindThis
  dragEndHandler(_event: DragEvent): void {}

  configure(): void {
    this.element.addEventListener("dragstart", this.dragStartHandler);
    this.element.addEventListener("dragend", this.dragEndHandler);
  }
  renderContent(): void {
    this.element.querySelector("h2")!.textContent = this.project.title;
    this.element.querySelector("h3")!.textContent = this.persons + " assigned";
    this.element.querySelector("p")!.textContent = this.project.desc;
  }
}

// ProjectList Class
class ProjList
  extends Component<HTMLDivElement, HTMLElement>
  implements DragTarget
{
  private assignedProjects: any[];

  constructor(private type: "active" | "finished") {
    super("project-list", "app", false, `${type}-projects`);
    this.assignedProjects = [];

    this.configure();
    this.renderContent();
  }

  @BindThis
  dragOverHandler(event: DragEvent): void {
    if (event.dataTransfer && event.dataTransfer.types[0] === "text/plain") {
      event.preventDefault();
      const listEl = this.element.querySelector("ul")!;
      listEl.classList.add("droppable");
    }
  }

  @BindThis
  dropHandler(event: DragEvent): void {
    const projId = event.dataTransfer!.getData("text/plain");
    projState.moveProject(
      projId,
      this.type === "active" ? ProjStatus.active : ProjStatus.finished
    );
  }

  @BindThis
  dragLeaveHandler(_event: DragEvent): void {
    const listEl = this.element.querySelector("ul")!;
    listEl.classList.remove("droppable");
  }

  renderProjects() {
    const listEL = document.getElementById(
      `${this.type}-projects-list`
    )! as HTMLUListElement;
    listEL.innerHTML = "";
    for (const project of this.assignedProjects) {
      new ProjItem(this.element.querySelector("ul")!.id, project);
    }
  }

  renderContent() {
    const projListHeading = this.element.querySelector(
      "h2"
    ) as HTMLHeadingElement;
    const projListContent = this.element.querySelector(
      "ul"
    ) as HTMLUListElement;

    projListHeading.textContent = `${this.type.toUpperCase()} PROJECTS`;
    projListContent.id = `${this.type}-projects-list`;
  }

  configure(): void {
    this.element.addEventListener("dragover", this.dragOverHandler);
    this.element.addEventListener("dragleave", this.dragLeaveHandler);
    this.element.addEventListener("drop", this.dropHandler);

    projState.addLisener((projects: Project[]) => {
      const relevantProjects = projects.filter((p) => {
        if (this.type === "active") {
          return p.status === ProjStatus.active;
        }
        return p.status === ProjStatus.finished;
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

// Instantiate project status
const projState = ProjState.getInstance();

// Instantiate project input
const projInput = new ProjInput();

// Instantiate project lists
const activeProjList = new ProjList("active");
const finishedProjList = new ProjList("finished");
