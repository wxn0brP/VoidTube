export interface UiComponent {
    element: HTMLDivElement | HTMLSelectElement | HTMLElement;
    mount(): void;
}
