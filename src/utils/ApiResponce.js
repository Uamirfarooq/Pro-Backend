class ApiResponce {
    constructor(statusCode,message = "success",data){
        this.statusCode = statusCode,
        this.message = message,
        this.data = data,
        this.statusCode = statusCode < 400
    }
}