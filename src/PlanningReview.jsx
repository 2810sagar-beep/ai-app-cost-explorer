import React,{useState} from 'react';

const labels={tasks:'Tasks / user / month',calls:'Model calls / task',input:'Input tokens / call',output:'Billable output tokens / call',storage:'Store uploaded files',fileMB:'File size / task (MB)',retention:'File retention (days)',downloads:'Downloads / task',retry:'Extra calls from retries (%)'};

export function PlanningReview({analysis,busy,onClarify,onApply}){
 const [answers,setAnswers]=useState({});
 const questions=analysis.stage==='questions';
 return <div className="analysis-note" aria-live="polite">
  <strong>{questions?'A few details make this more useful':'Your proposed base case'}</strong>
  <p>{analysis.summary}</p>
  {questions?<form className="planning-questions" onSubmit={e=>{e.preventDefault();onClarify(analysis.questions.map(q=>({question:q.question,answer:answers[q.id]?.trim()||'I do not know. Use a clearly labelled planning estimate.'})));}}>
   {analysis.questions.map(q=><label className="planning-question" key={q.id}><span>{q.question}</span>{q.why&&<small>{q.why}</small>}<textarea maxLength={600} rows={2} value={answers[q.id]||''} disabled={busy} placeholder={q.placeholder} onChange={e=>setAnswers(prev=>({...prev,[q.id]:e.target.value}))}/></label>)}
   <p>Unsure? Leave an answer blank and AI will label its estimate for you to review. Monthly active users stay under your control below.</p>
   <button className="button primary wide" type="submit" disabled={busy}>{busy?'Planning your workload…':'Create my base case'}</button>
  </form>:<>
   <p className="estimate-label">Planning estimates · review before applying</p>
   <dl className="planning-values">{Object.entries(labels).filter(([k])=>analysis.assumptions.storage||!['fileMB','retention','downloads'].includes(k)).map(([key,label])=><div key={key}><dt>{label}</dt><dd>{typeof analysis.assumptions[key]==='boolean'?(analysis.assumptions[key]?'Yes':'No'):new Intl.NumberFormat('en-US',{maximumFractionDigits:2}).format(analysis.assumptions[key])}</dd></div>)}</dl>
   <strong>Why these assumptions?</strong><ul>{analysis.reasons.map((x,i)=><li key={i}>{x}</li>)}</ul>
   <p>These numbers need validation with real usage. User count and hosting stay at your chosen values.</p>
   {analysis.uncertainties.length>0&&<><strong>Still uncertain or outside this estimate</strong><ul>{analysis.uncertainties.map((x,i)=><li key={i}>{x}</li>)}</ul></>}
   <button className="button outline" disabled={analysis.applied||busy} onClick={onApply}>{analysis.applied?'Base case applied':'Apply this base case'}</button>
  </>}
 </div>;
}
