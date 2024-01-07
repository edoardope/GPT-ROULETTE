let Ai1_prompt = document.getElementById("firstPrompt").value;
let Ai2_prompt = document.getElementById("secondPrompt").value;
let Ai3_prompt = document.getElementById("thirdPrompt").value;

let API_KEY = document.getElementById("apikey").value;
const API_BASE_URL = 'https://api.openai.com/v1';
let GPT_MODEL = "gpt-4-1106-preview"; 

let UserInput = document.getElementById("UserInput").value;
let SetUpButton = document.getElementById("SetUp"); 
let Stop = document.getElementById("Stop");
let SendTask = document.getElementById("SendTask");

let ScreenChat = document.getElementById("chat-output"); 

let masterChat = [];
let slave1Chat = [];
let slave2Chat = [];
let slave3Chat = [];
let FinalMasterChat = [];

let screenContent = [];

let Task2Present = false;
let Task3Present = false;

let Task1 = "";
let Task2 = "";
let Task3 = "";

let Task1Response = "";
let Task2Response = "";
let Task3Response = "";

let MasterResponse = "";

SetUpButton.addEventListener('click', async function () {

    Ai1_prompt = document.getElementById("firstPrompt").value;
    Ai2_prompt = document.getElementById("secondPrompt").value;
    Ai3_prompt = document.getElementById("thirdPrompt").value;

    API_KEY = document.getElementById("apikey").value;

    await setup();
});


SendTask.addEventListener('click', async function () {
    UserInput = document.getElementById("UserInput").value;
    await start();
});



async function setup() {

    console.log("inizialization started....")

    slave1Chat.push({
        role: 'system',
        content: Ai1_prompt
    });

    slave2Chat.push({
        role: 'system',
        content: Ai2_prompt
    });

    slave3Chat.push({
        role: 'system',
        content: Ai3_prompt
    });

    masterChat.push({
        role: 'system',
        content: ` 
Master: 
il tuo compito è svolgere il ruolo del master in un sistema basato su quattro lavoratori: un master(tu) e tre collaboratori(GPT). Riceverai un task dall’utente in base alla complessità del task deciderai se suddividerlo in un numero di sotto task che va da 1 a 3 che fornirai ai collaboratori una volta ricevuta la risposta dai collaboratori ti occuperai di effettuare eventuali correzioni e basandoti sul lavoro svolto fornire una risposta il più accurata possibile al task le tue risposte potranno essere molto lunghe o brevi a seconda della richiesta e del desiderio espresso dall’utente. Ogni tua risposta dovra essere in formato json senza alcuna eccezione. Le tue risposte saranno formattate in due modi differenti come indicato nelle regole di comportamento è importante che tu capisca quando rispondere con lo scenario 1 (l’utente ti assegna un task) e quando rispondere con lo scenario 2 (risposta successiva allo scenario 1, quando dopo aver generato i task i collaboratori di mandano le risposte hai task vedrai scritto: "Collaboratore 1: " + Task1Response + "Collaboratore 2: " + Task2Response + "Collaboratore 3: " + Task3Response. Dove TaskResponse sta per la risposta dell’collaboratore rispettivo)
-Comportamento(come ti dovrai comportare e rispondere a seconda degli scenari):
   -Scenario 1(se ti viene assegnato un task dall’utente):
       { “Task1”: “task assegnato al collaboratore 1”, “Task2Necessary” : True/False(a seconda se sia             necessario o no assegnare 2 o piu sotto task per rispondere al task dell’utente”, “Task2”: “task assegnato al collaboratore 2”,  “Task3Necessary” : True/False(a seconda se sia necessario o no assegnare 3 sotto task per rispondere al task dell’utente”, “Task2”: “task assegnato al collaboratore 3” }
  -Scenario 2(quando ti viene restituita la risposta dai collaboratori):
      { “userResponse”: “risposta finale basata sul lavoro complessivo svolto finora” }

        `
    });

    const masterChatSetup = await makeRequest('/chat/completions', {
        temperature: 0.2,
        model: GPT_MODEL,
        messages: masterChat 
    });

    console.log("master: " + masterChatSetup.choices[0].message.content)

    screenContent.push("master: " + masterChatSetup.choices[0].message.content);
    updateScreen(screenContent);

    const slave1ChatSetup = await makeRequest('/chat/completions', {
        temperature: 0.2,
        model: GPT_MODEL,
        messages: slave1Chat 
    });

    console.log("slave 1: " + slave1ChatSetup.choices[0].message.content)

    screenContent.push("slave 1: " + slave1ChatSetup.choices[0].message.content);
    updateScreen(screenContent);

     const slave2ChatSetup = await makeRequest('/chat/completions', {
         temperature: 0.2,
         model: GPT_MODEL,
         messages: slave2Chat 
     });

     console.log("slave 2: " + slave2ChatSetup.choices[0].message.content)

     screenContent.push("slave 2: " + slave2ChatSetup.choices[0].message.content);
     updateScreen(screenContent);

     const slave3ChatSetup = await makeRequest('/chat/completions', {
        temperature: 0.2,
         model: GPT_MODEL,
         messages: slave3Chat 
    });

    console.log("slave 3: " + slave3ChatSetup.choices[0].message.content);

    screenContent.push("slave 3: " + slave3ChatSetup.choices[0].message.content);
    updateScreen(screenContent);

    console.log("inizialization ended")

}

function cleanJsonString(jsonString) {
    // Rimuovi le parti superflue dalla stringa JSON
    return jsonString.replace(/^```json|```$/g, '').trim();
}

async function start() {

    console.log("sending task to master....")

    masterChat.push({
        role: 'user',
        content: "task: " + UserInput
    });

    screenContent.push("user: " + UserInput);
    updateScreen(screenContent);

    const masterChatSetup = await makeRequest('/chat/completions', {
        temperature: 0.2,
        model: GPT_MODEL,
        messages: masterChat 
    });

    let masterResponse = cleanJsonString(masterChatSetup.choices[0].message.content);

    masterResponse = JSON.parse(masterResponse);

    console.log("master response: ");

    Task1 = masterResponse.Task1;

    screenContent.push("master task1: " + Task1);
    updateScreen(screenContent);

    console.log("Task1: " + Task1);

    console.log("master response Task 2 present: " + masterResponse.Task2Necessary);

    Task2Present = masterResponse.Task2Necessary;

    if(Task2Present) {
        Task2 = masterResponse.Task2;

        screenContent.push("master task2: " + Task2);
        updateScreen(screenContent);

    }

    console.log("Task2: " + Task2);

    console.log("master response Task 3 present: " + masterResponse.Task3Necessary);

    Task3Present = masterResponse.Task3Necessary;

    if(Task3Present) {
        
        Task3 = masterResponse.Task3;

        screenContent.push("master task3: " + Task3);
        updateScreen(screenContent);
        
    } 

    console.log("Task3: " + Task3);

    await callSlave()

}

async function callSlave(){

    slave1Chat.push({
        role: 'user',
        content: Task1
    });

    const slave1Response = await makeRequest('/chat/completions', {
        temperature: 0.2,
        model: GPT_MODEL,
        messages: slave1Chat 
    });

    Task1Response = slave1Response.choices[0].message.content

    console.log("Slave1 response: " + Task1Response);

    screenContent.push("collaboratore 1: " + Task1Response);
    updateScreen(screenContent);

    if(Task2Present){

        slave2Chat.push({
            role: 'user',
            content: Task2
        });
    
        const slave2Response = await makeRequest('/chat/completions', {
            temperature: 0.2,
            model: GPT_MODEL,
            messages: slave2Chat 
        });
    
        Task2Response = slave2Response.choices[0].message.content;
    
        console.log("Slave2 response: " + Task2Response);

        screenContent.push("collaboratore 2: " + Task2Response);
        updateScreen(screenContent);
    }

    if(Task3Present){

        slave3Chat.push({
            role: 'user',
            content: Task3
        });
    
        const slave3Response = await makeRequest('/chat/completions', {
            temperature: 0.2,
            model: GPT_MODEL,
            messages: slave3Chat 
        });
    
        Task3Response = slave3Response.choices[0].message.content;
    
        console.log("Slave3 response: " + Task3Response);

        screenContent.push("collaboratore 3: " + Task3Response);
        updateScreen(screenContent);
    }

    GetMasterResponse()

}

async function GetMasterResponse(){

    console.log("Contacting master...")

    FinalMasterChat.push({
        role: 'system',
        content: "Tu sei l’anello finale di una catena prima di te 3 collaboratori hanno lavorato per rispondere alla seguente richiesta dell’ utente: "
         + UserInput + 
        "Basandoti sull’ lavoro svolto dai 3 collaboratori dovrai soddisfare la richiesta dell’utente è obbligatorio che tu rispetti la richiesta dell’utente alla lettera utilizzando piu parole/token possibili cerca sempre di fornire risposte molto lunghe se ti viene chiesto, di seguito trovi il lavoro svolto dai collaboratori: " 
        + " collaboratore 1: " + Task1Response 
        + " collaboratore 2: " + Task2Response
        + " collaboratore 3: " + Task3Response +
        ' Ora che hai raccolto il lavoro svolto rispondi all’utente in questa maniera in formato json: '
        + `{ “userResponse”: “risposta finale basata sul lavoro complessivo svolto finora”, "responseNumber": (nemuero da 1 a 3 che sta and indicare il numero di risposte che ti servono per completare la task) }` +
        ` nel caso ti rendessi conto di non poter rispondere in maniera appropriata con un solo messaggio userai il campo responseNumber quando lo farai riceverai un messaggio da system con la richiesta di continuare e risponderai con la continuazione mantenendo la struttura json usata fino ad ora `
        
    });

    const masterFinalResponse= await makeRequest('/chat/completions', {
        temperature: 0.2,
        model: GPT_MODEL,
        messages: FinalMasterChat
    });

    let masterResponse = cleanJsonString(masterFinalResponse.choices[0].message.content);

    masterResponse = JSON.parse(masterResponse);

    console.log("final response: " + masterResponse.userResponse)

    screenContent.push("master final response: " + masterResponse.userResponse);
    updateScreen(screenContent);

    let responseNumber = masterResponse.responseNumber;

    console.log("responseNumber "+ responseNumber);

    if(responseNumber >= 1){

        await GetMAsterFollowup(responseNumber);
    }
}

async function GetMAsterFollowup(x, exresponse) {

    for (let i = 0; i < x; i++) {
        
        FinalMasterChat.push({
            role: 'system',
            content: "il tuo lavoro è continuare da dove ti sei interrotto nella precedente risposta"
        });

        const masterFinalResponse= await makeRequest('/chat/completions', {
            temperature: 0.2,
            model: GPT_MODEL,
            messages: FinalMasterChat
        });

        let masterResponse = cleanJsonString(masterFinalResponse.choices[0].message.content);

        masterResponse = JSON.parse(masterResponse);

        console.log("final response: " + masterResponse.userResponse)

        screenContent.push("master final response: " + masterResponse.userResponse);
        updateScreen(screenContent);
    
    }
}

async function makeRequest(endpoint, payload) {
    const url = API_BASE_URL + endpoint;

    const response = await fetch(url, {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: {
            "type": "json_object",
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + API_KEY
        }
    })

    const jsonResponse = await response.json();
    return jsonResponse;
}

function updateScreen(array){
    // Assicurati che il div "screen" esista
    if (!ScreenChat) {
        console.error("Il div 'screen' non esiste.");
        return;
    }

    ScreenChat.innerHTML = ""

    // Cicla attraverso l'array
    array.forEach(function (element) {
        // Crea un nuovo div con classe "message"
        var messageDiv = document.createElement("div");
        messageDiv.className = "message";

        // Aggiungi il testo dell'elemento all'interno del div "message"
        messageDiv.textContent = element;

        // Inserisci il div "message" all'interno del div "screen"
        ScreenChat.appendChild(messageDiv);
    });
}
