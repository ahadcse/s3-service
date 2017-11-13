class BadRequestException {
    constructor()
        {
            this.message = "Bad Request: Empty or invalid payload";
            this.statusCode = 400;
        }
}
class NotAsArrayException {
    constructor()
    {
        this.message = "Bad request: Payload should be array of event objects";
        this.statusCode = 400;
    }
}

class AttributeMissingException {
    constructor(errors)
    {
        this.message = "Bad request: Following attributes in payload required: [" + errors + "]";
        this.statusCode = 400;
    }
}

BadRequestException.prototype = Object.create(Error.prototype);
NotAsArrayException.prototype = Object.create(Error.prototype);
AttributeMissingException.prototype = Object.create(Error.prototype);

exports.BadRequestException=BadRequestException;
exports.NotAsArrayException=NotAsArrayException;
exports.AttributeMissingException=AttributeMissingException;
