export default class Response {

    static Success = "success";
    static Error = "error";

    constructor(status, result, message) {
        this.status = status;
        this.result = result;
        this.message = message;
    }
}