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
        let inputMethod = new ExpressionInputMethod();
        inputMethod.process(query).then(function(result) {
            Logger.log("Result to send:" + result);
            res.json(new Response(Response.Success, result, ""));
        });
    }
}

export default Server;