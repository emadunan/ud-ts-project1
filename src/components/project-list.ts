import { BindThis } from "../decorators/bind-this.js";
import { DragTarget } from "../models/drag-interfaces.js";
import { Project, ProjStatus } from "../models/type-definitions.js";
import { projState } from "../state/project-state.js";
import { Component } from "./main-component.js";
import { ProjItem } from "./project-item.js";

export class ProjList
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