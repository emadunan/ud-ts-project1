export function BindThis(
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