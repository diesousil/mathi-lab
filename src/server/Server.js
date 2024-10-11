import Express from "express";
import ExpressionInputMethod from "../input/MathExpression.js";
import EquationInputMethod from "../input/Equation.js";
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
            Logger.debug("Server running on port " + this.port);
            console.log("Server running on port " + this.port)
        }, this);

        return app;
    }

    setupRoutes() {

        let app = this.expressServer;
        app.get('/expression/:query', (req, res) => {
            this.expresssionInput(req.params, res);
          });

        app.get('/equation/:query', (req, res) => {
            this.equationInput(req.params, res);
        });
    }

    equationInput(query, res) {
        const startDateTime = Date.now();
        Logger.debug("Started: " + startDateTime.toString());
    
        let inputMethod = new EquationInputMethod();
        inputMethod.process(query).then(function(result) {

            const endDateTime = Date.now();
            Logger.debug("Ended: " + endDateTime.toString());
                
            res.json(new Response(Response.Success, result, "", endDateTime-startDateTime));
        });
    }

    expresssionInput(query, res) {
        const startDateTime = Date.now();
        Logger.debug("Started: " + startDateTime.toString());
    
        let inputMethod = new ExpressionInputMethod();
        inputMethod.process(query).then(function(result) {

            const endDateTime = Date.now();
            Logger.debug("Ended: " + endDateTime.toString());
                
            res.json(new Response(Response.Success, result, "", endDateTime-startDateTime));
        });
    }
}

export default Server;