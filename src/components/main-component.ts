export abstract class Component<T extends HTMLElement, U extends HTMLElement> {
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