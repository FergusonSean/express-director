const createApp = require('.');

let app;

(async () => {
    app = await createApp();
    app.listen(3300);
})();
