import { Listener, Project, ProjStatus } from "../models/type-definitions.js";

export class State<T> {
    protected listeners: Listener<T>[] = [];

    addLisener(listener: Listener<T>) {
        this.listeners.push(listener);
    }
}

export class ProjState extends State<Project> {
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

// Instantiate project status
export const projState = ProjState.getInstance();