import { BindThis } from "../decorators/bind-this.js";
import { Draggable } from "../models/drag-interfaces.js";
import { Project } from "../models/type-definitions.js";
import { Component } from "./main-component.js";

export class ProjItem
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