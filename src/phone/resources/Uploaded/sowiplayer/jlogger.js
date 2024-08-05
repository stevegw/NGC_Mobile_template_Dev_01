class Jlogger {
    #showOutput;
    #sectionName

    constructor(loggerName = "NameNotSet", sectionName) {
        this.loggerName = loggerName;
        this.#showOutput = true;
        this.#sectionName = sectionName
    }

    getAppName () {
        return this.#sectionName;
    }

    getShowOutput() {
        return this.#showOutput;
    }

    setShowOutput(bval) {
        this.#showOutput = bval;
    }

    dateTimeStr() {
        var m = new Date();
        var dateString =
            m.getUTCFullYear() + "/" +
            ("0" + (m.getMonth() + 1)).slice(-2) + "/" +
            ("0" + m.getDate()).slice(-2) + " " +
            ("0" + m.getHours()).slice(-2) + ":" +
            ("0" + m.getMinutes()).slice(-2) + ":" +
            ("0" + m.getSeconds()).slice(-2) + ":" +
            ("0" + m.getMilliseconds()).slice(-2);

        return dateString;
    }

    buildTabs(tn) {
        let tbs = ""
        for (let x = 1; x < tn; x++) {
            tbs = tbs + '\t';
        }
        return tbs;
    }

    //m = message
    //l = location
    //d = depth 
    output(m, l = "", d = 0) {
        if (this.#showOutput) {
            let dt_str = this.dateTimeStr();
            let displaymsg = "##### " + dt_str + " # - " + this.loggerName + " [" + this.#sectionName + "]" + " : ";
            let tabIndent = "";
            if (l.length > 0) {displaymsg = displaymsg + "(" + l + ")";}
            if (d > 0) { tabIndent = this.buildTabs(d)}
            console.log(displaymsg + " " + tabIndent + m);
        }
    }
}
