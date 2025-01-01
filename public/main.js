import { waterCraft } from './waterCraft.js'
      
export async function main() {
    
    // Create Peers
    const w1 = await waterCraft();
    const w1_id = w1.id; 
    
    const w2 = await waterCraft(w1_id);

    // const w3 = waterCraft();
    // w3.connect(w1_id);

    // Monitor messages
    w1.onMsg(msg => {
        console.log(`w1: ${msg}`);
    });
    w2.onMsg(msg => {
        console.log(`w2: ${msg}`);
    });
    // w3.onMsg(msg => {
    //     console.log(`w3: ${msg}`);
    // });

    // w1.sendMsg("msg from w1");

}