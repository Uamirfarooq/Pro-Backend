class ApiError extends Error {
    constructor(
        statusCode,
        message= "Some Thing Went Wrong",
        error = [],
        stack = ""
    ){
        super(message),
        this.statusCode = statusCode,
        this.error = error,
        this.data = null,
        this.success = false

        if(stack){
        this.stack = stack
        }else{
            Error.captureStackTrace(this,this.constructor)
        }
    }

}

export default ApiError