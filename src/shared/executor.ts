interface Task {
    id: string;
    func: (...args: any[]) => Promise<any>;
    param: any[];
    priority: number;
    resolve: (value: any) => void;
    reject: (reason?: any) => void;
}

class Executor {
    private queue: Task[] = [];
    private activeTasks = new Set<string>(); // IDs of currently running tasks
    private isRunning: boolean = false;
    private activeCount: number = 0;

    constructor(private maxConcurrency: number = 1) { }

    /**
     * Adds a new task to the queue
     * @param id - a unique identifier for the task
     * @param func - an asynchronous function
     * @param priority - the higher the number, the higher the priority
     * @param param - arguments to be passed to func
     */
    add<T>(id: string, func: (...args: any[]) => Promise<T>, priority: number = 0, ...param: any[]): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            const task: Task = {
                id,
                func,
                param,
                priority,
                resolve,
                reject
            };

            // Insert into the queue based on priority (in descending order)
            this.queue.push(task);
            this.queue.sort((a, b) => b.priority - a.priority);

            this.run();
        });
    }

    /**
     * Cancels a task with the given ID (removes it from the queue if it has not yet started)
     */
    cancel(id: string) {
        const task = this.queue.find(task => task.id === id);
        if (!task) return false;
        task.reject("Task canceled");
        this.queue.splice(this.queue.indexOf(task), 1);
        return true;
    }

    /**
     * Cancels all tasks
     */
    cancelAll() {
        this.queue.forEach(task => task.reject("Task canceled"));
        this.queue = [];
        return true;
    }

    /**
     * Runs tasks according to the concurrency limit
     */
    private async run(): Promise<void> {
        if (this.isRunning) return;
        this.isRunning = true;

        while (this.queue.length > 0 || this.activeCount > 0) {
            while (this.activeCount < this.maxConcurrency && this.queue.length > 0) {
                const task = this.queue.shift()!;

                // Check if the task was not canceled before starting
                if (this.queue.some(t => t.id === task.id)) continue;

                this.activeTasks.add(task.id);
                this.activeCount++;

                this.executeTask(task).finally(() => {
                    this.activeTasks.delete(task.id);
                    this.activeCount--;
                    this.run(); // Continue after one task has finished
                });
            }

            await this.sleep(50); // short pause to not overload CPU
        }

        this.isRunning = false;
    }

    /**
     * Executes a single task and resolves or rejects its Promise
     */
    private async executeTask(task: Task): Promise<void> {
        try {
            const result = await task.func(...task.param);
            task.resolve(result);
        } catch (error) {
            task.reject(error);
        }
    }

    /**
     * Helper function to wait for a certain amount of time
     */
    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

export default Executor;
