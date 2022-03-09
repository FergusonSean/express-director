import createApp from './index.js';

let app;

(async () => {
    app = await createApp();
    app.listen(3300);
})();
