import Express from "express";
import ExpressionInputMethod from "../input/MathExpression.js";
import Logger from "../common/Logger.js";
import Response from "./Response.js";

class Server {
    
    constructor(port) {
        this.port = port;
        this.expressServer = this.start();
        this.setupRoutes();
    }

    start() {
        var app = Express();
        app.listen(this.port, () => {
            Logger.log("Server running on port " + this.port);
        }, this);

        return app;
    }

    setupRoutes() {

        let app = this.expressServer;
        app.get('/expression/:query', (req, res) => {
            this.expresssionInput(req.params, res);
          });
    }

    expresssionInput(query, res) {
        const startDateTime = Date.now();
        Logger.log("Started: " + startDateTime.toString());
    
        let inputMethod = new ExpressionInputMethod();
        inputMethod.process(query).then(function(result) {

            const endDateTime = Date.now();
            Logger.log("Ended: " + endDateTime.toString());
                
            res.json(new Response(Response.Success, result, "", endDateTime-startDateTime));
        });
    }
}

export default Server;