try {
    if(process.argv[2] === "SERVER") {
        server();
    }
} catch(e) {}

export async function server() {
    const { watch } = require('fs');

    let server = null;
    let client = null;
    let restarting = false;
    
    async function restartServer() {
        restarting = true;
    
        if (server) server.stop();
        if (client) client.close();
        server = null;
        client = null;
    
        // Uncomment to bundle a 'src' folder into a 'build' directory 
        // await Bun.build({
        //     entrypoints: ['./src/script.js'],
        //     outdir: './build',
        // });
    
        server = Bun.serve({
            port: 3000,
            async fetch(req, server) {
                const url = new URL(req.url);
    
                if (url.pathname === "/hotpocket") {
                    return server.upgrade(req);
                }
                
                if (url.pathname === "/") {
                    return new Response(Bun.file('./public/index.html'));
                }
    
                return new Response(Bun.file(`./public/${url.pathname}`));
            },
            websocket: {
                async open(ws) {
                    client = ws;
                },
            },
        });
        
        console.log(`localhost:${server.port}`);
        restarting = false;
    }
    
    // Restart on file change
    watch(
        './public',
        { recursive: true },
        async (_event, _filename) => {
            if (!restarting) await restartServer();
        },
    );
    
    // Initial server start
    await restartServer();
} 

export function client() {
    const socket = new WebSocket("ws://localhost:3000/hotpocket");
    function reload(_event) {
        setTimeout(() => {
            socket.close();
            location.reload();
        }, 100);
    }
    socket.addEventListener("close", reload);
    socket.addEventListener("error", reload);
}
