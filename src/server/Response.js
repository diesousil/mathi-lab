export default class Response {

    static Success = "success";
    static Error = "error";

    constructor(status, result, message, time) {
        this.status = status;
        this.result = result;
        this.message = message;
        this.time = time + " ms";
    }
}