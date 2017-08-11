
declare module 'ndns' {
  declare class Message {
    header: MessageHeader; 
    q: MessageObject;
    rr: MessageObject;
    
    setHeader(headers: {[key: string]: string}): void; 
  }
  
  declare class MessageHeader {
    id: number; 
    qr: number; 
    opcode: number; 
    aa: number; 
    tc: number; 
    rd: number; 
    ra: number; 
    a: number; 
    ad: number; 
    cd: number; 
    rcode: number; 
  }
  
  declare class MessageObject {
    
  }
}