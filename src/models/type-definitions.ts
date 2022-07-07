export type Validatable = {
    value: string | number;
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
};

export type Listener<T> = (x: T[]) => void;

export enum ProjStatus {
    active,
    finished,
}

export class Project {
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