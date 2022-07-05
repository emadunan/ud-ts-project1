// Validator Function
type Validatable = {
    value: string | number;
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
};

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
        get () {
            const boundFn = originalMethod.bind(this)
            return boundFn;
        }
    }

    return newDescriptor;
}

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
            this.clearInputs();
        }
    }

    private configure() {
        this.formElement.addEventListener("submit", this.submitHandler);
    }

    private attach() {
        this.mainElement.append(this.formElement);
    }
}

const projInput = new ProjInput();