import createApp from '.';

let app;

(async () => {
    app = await createApp();
    app.listen(3300);
})();
