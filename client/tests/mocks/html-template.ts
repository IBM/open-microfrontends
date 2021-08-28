export const template = (body: string, script: string = "") => `
<!doctype html>
<html>
    <head>
        <title>Hello World Example</title>
        <script src="/bundle.js" defer></script>
    </head>
    <body>
        ${body}
        <script>${script}</script>
    </body>
</html>`;
