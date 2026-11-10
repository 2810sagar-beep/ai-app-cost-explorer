export async function readBackendResponse(response,action){
 let data;
 try{data=await response.json();}catch{
  throw new Error([400,404].includes(response.status)
   ?'This address did not reach the AI backend. Use the pre-filled full function URL.'
   :response.status===504
    ?'The AI request did not complete (HTTP 504). Check the API function runtime logs for the cause.'
    :`The backend did not return JSON (HTTP ${response.status}).`);
 }
 // A transport 200 alone is not success: DigitalOcean's .json URL returns
 // the complete function response, including its nested statusCode.
 const wrapped=Number.isInteger(data?.statusCode)&&data?.body&&typeof data.body==='object';
 const status=wrapped?data.statusCode:response.status,result=wrapped?data.body:data;
 if(!response.ok||status>=400)throw new Error(result?.error||`Backend returned ${status}.`);
 if(action==='status'&&(typeof result?.live!=='boolean'||typeof result?.model!=='string'))
  throw new Error('This URL did not return the AI backend status. Use the pre-filled full function URL.');
 return result;
}
