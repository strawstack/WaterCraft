import { waterCraft } from './waterCraft.js'
      
export async function main() {
    
    // Create Peers
    const w1 = await waterCraft();
    const w2 = await waterCraft();
    const w3 = await waterCraft();

    const peers = [w1, w2, w3];
    const hid = peers.map(w => w.id).sort((a, b) => a.localeCompare(b))[0];
    
    for (let p of peers) {
        if (p.id !== hid) p.connect(hid);
    }

    // Monitor messages
    w1.onMsg(msg => {
        console.log(`w1: ${msg}`);
    });
    w2.onMsg(msg => {
        console.log(`w2: ${msg}`);
    });
    w3.onMsg(msg => {
        console.log(`w3: ${msg}`);
    });

    const host = peers.find(p => p.id === hid);

    setTimeout(() => {
        host.sendMsg("msg from host");
    }, 3000);

}