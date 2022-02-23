import createApp from '.';

let app;

(async () => {
    app = await createApp();
    return app.listen(3300);
})().catch(() => process.exit(1));
