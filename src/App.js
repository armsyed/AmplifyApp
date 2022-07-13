import React, { useState, useEffect } from 'react';
import './App.css';
import { API, Storage } from 'aws-amplify';
import { withAuthenticator, AmplifySignOut } from '@aws-amplify/ui-react-v1';
import { listNotes } from './graphql/queries';
import { createNote as createNoteMutation, deleteNote as deleteNoteMutation } from './graphql/mutations';
// import { jsPDF } from "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable';
import { TextField } from '@aws-amplify/ui-react';


const initialFormState = { name: '', description: '' }

class App extends React.Component {
  // const [notes, setNotes] = useState([]);
  // const [formData, setFormData] = useState(initialFormState);
  // element.addEventListener("click", demoPDF);

  // useEffect(() => {
  //   fetchNotes();
  // }, []);

  generatePDF = () => {
    var doc = new jsPDF('p', 'pt');
    
    // doc.setFont(undefined, 'bold').text("Project Status: ").setFont(undefined, 'normal')
    var imgData = 'data:image/png;base64,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'
    doc.addImage(imgData, 'JPEG', 250, 15, 100, 50);
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold').text(20, 70, 'Project Status: ');
    doc.setFont(undefined, 'normal').text(100, 70, document.getElementById("projName").value )
    doc.setFont(undefined, 'bold').text(20, 90, 'Week Ending: ');
    doc.setFont(undefined, 'normal').text(90, 90, document.getElementById("wkEnd").value )
    doc.setFont(undefined, 'bold').text(20, 110, 'AWS Billing Account ID: ');
    doc.setFont(undefined, 'normal').text(140, 110, document.getElementById("billId").value )
    doc.setFont(undefined, 'bold').text(20, 130, 'Period of Performance End Date: ');
    doc.setFont(undefined, 'normal').text(180, 130, document.getElementById("perfDate").value )
    doc.setFont(undefined, 'bold').text(20, 150, 'Background: ');
    doc.setFont(undefined, 'normal').text(90, 150, document.getElementById("background").value )
    
    var columns = [
      { title: "Project", dataKey: "proj" },
      { title: "Status", dataKey: "stat" },
      { title: "Notes", dataKey: "note" }
    ];
    
    var rows = [
      { proj: "Overall Status ", stat: document.getElementById("proj_stat").value, note: document.getElementById("proj_stat_notes").value},
      { proj: "Total SOW Units", stat: document.getElementById("sow_input").value, note: document.getElementById("sow_notes").value},
      { proj: "Units Burned", stat: document.getElementById("units_burned_input").value, note: document.getElementById("units_burned_notes").value},
      { proj: "Units remaining", stat: document.getElementById("units_remaining_input").value, note: document.getElementById("units_remaining_notes").value},
      { proj: "Percentage Burned",  stat: document.getElementById("percent_burned_input").value, note: document.getElementById("percent_burned_notes").value },
      { proj: "Risks/Burn Rate Concerns/Scope Concerns", stat: document.getElementById("risks_input").value, note: document.getElementById("risks_notes").value }
    ];

    doc.setFontSize(14);
    doc.setFont(undefined, 'bold').text(12, 190, 'Status Snapshot: ');
    doc.autoTable(columns, rows, {
      startY: doc.autoTableEndPosY() + 195,
      margin: { horizontal: 10 },
      styles: { overflow: 'linebreak' },
      bodyStyles: { valign: 'top' },
      columnStyles: { text: { columnWidth: 'wrap' } },
      theme: "striped"
    });

    var columns2 = [
      { title: document.getElementById("sow_input").value + " units", dataKey: "units" },
      // { title: "Forecasted Units", dataKey: "f_units" },
      // { title: "Units Burned", dataKey: "b_units" },
      { title: "Jan '" + (new Date().getFullYear() - 1 + "").substring(2), dataKey: "old_jan" },
      { title: "Feb '" + (new Date().getFullYear() - 1 + "").substring(2), dataKey: "old_feb" },
      { title: "Mar '" + (new Date().getFullYear() - 1 + "").substring(2), dataKey: "old_mar" },
      { title: "April '" + (new Date().getFullYear() - 1 + "").substring(2), dataKey: "old_apr" },
      { title: "Jun '" + (new Date().getFullYear() - 1 + "").substring(2), dataKey: "old_jun" },
      { title: "July '" + (new Date().getFullYear() - 1 + "").substring(2), dataKey: "old_jul" },
      { title: "Aug '" + (new Date().getFullYear() - 1 + "").substring(2), dataKey: "old_aug" },
      { title: "Sept '" + (new Date().getFullYear() - 1 + "").substring(2), dataKey: "old_sept" },
      { title: "Oct '" + (new Date().getFullYear() - 1 + "").substring(2), dataKey: "old_oct" },
      { title: "Nov '" + (new Date().getFullYear() - 1 + "").substring(2) , dataKey: "old_nov" },
      { title: "Dec '" + (new Date().getFullYear() - 1 + "").substring(2), dataKey: "old_dec" },
      { title: "Jan '" + (new Date().getFullYear() + "").substring(2), dataKey: "jan" },
      { title: "Feb '" + (new Date().getFullYear() + "").substring(2), dataKey: "feb" },
      { title: "Mar '" + (new Date().getFullYear() + "").substring(2), dataKey: "mar" },
      { title: "April '" + (new Date().getFullYear() + "").substring(2), dataKey: "apr" },
      { title: "Jun '" + (new Date().getFullYear() + "").substring(2), dataKey: "jun" },
      { title: "July '" + (new Date().getFullYear() + "").substring(2), dataKey: "jul" },
      { title: "Aug '" + (new Date().getFullYear() + "").substring(2), dataKey: "aug" },
      { title: "Sept '" + (new Date().getFullYear() + "").substring(2), dataKey: "sept" },
      { title: "Oct '" + (new Date().getFullYear() + "").substring(2), dataKey: "oct" },
      { title: "Nov '" + (new Date().getFullYear() + "").substring(2), dataKey: "nov" },
      { title: "Dec '" + (new Date().getFullYear() + "").substring(2), dataKey: "dec" },

    ];
    
    var rows2 = [
      { units: "Forecast Units ", old_jan: document.getElementById("january").value, 
      old_feb: document.getElementById("feburary").value, 
      old_mar: document.getElementById("march").value, 
      old_apr: document.getElementById("april").value, 
      old_may: document.getElementById("may").value, 
      old_jun: document.getElementById("june").value, 
      old_jul: document.getElementById("july").value, 
      old_aug: document.getElementById("august").value, 
      old_sept: document.getElementById("september").value, 
      old_oct: document.getElementById("october").value, 
      old_nov: document.getElementById("november").value, 
      old_dec: document.getElementById("december").value, 
      jan: document.getElementById("january_2").value, 
      feb: document.getElementById("feburary_2").value,
      mar: document.getElementById("march_2").value, 
      apr: document.getElementById("april_2").value, 
      may: document.getElementById("May_2").value, 
      jun: document.getElementById("june_2").value, 
      jul: document.getElementById("july_2").value, 
      aug: document.getElementById("august_2").value, 
      sept: document.getElementById("september_2").value, 
      oct: document.getElementById("october_2").value, 
      nov: document.getElementById("november_2").value, 
      dec: document.getElementById("december_2").value },

      { units: "Units Burned ", old_jan: document.getElementById("january_3").value, 
      old_feb: document.getElementById("feburary_3").value, 
      old_mar: document.getElementById("march_3").value, 
      old_apr: document.getElementById("april_3").value, 
      old_may: document.getElementById("May_3").value, 
      old_jun: document.getElementById("june_3").value, 
      old_jul: document.getElementById("july_3").value, 
      old_aug: document.getElementById("august_3").value, 
      old_sept: document.getElementById("september_3").value, 
      old_oct: document.getElementById("october_3").value, 
      old_nov: document.getElementById("november_3").value, 
      old_dec: document.getElementById("december_3").value, 
      jan: document.getElementById("january_4").value, 
      feb: document.getElementById("feburary_4").value,
      mar: document.getElementById("march_4").value, 
      apr: document.getElementById("april_4").value, 
      may: document.getElementById("May_4").value, 
      jun: document.getElementById("june_4").value, 
      jul: document.getElementById("july_4").value, 
      aug: document.getElementById("august_4").value, 
      sept: document.getElementById("september_4").value, 
      oct: document.getElementById("october_4").value, 
      nov: document.getElementById("november_4").value, 
      dec: document.getElementById("december_4").value },
    ];

    doc.setFontSize(14);
    doc.setFont(undefined, 'bold').text(12, doc.autoTableEndPosY() + 205, 'Forecast: ');
    doc.autoTable(columns2, rows2, {
      startY: doc.autoTableEndPosY() + 210,
      margin: { horizontal: 0 },
      styles: { overflow: 'linebreak' },
      bodyStyles: { valign: 'top' },
      columnStyles: { text: { columnWidth: 'wrap' } },
      theme: "striped"
    });

    doc.addPage(); 
    var imgData = 'data:image/png;base64,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'
    doc.addImage(imgData, 'JPEG', 250, 15, 100, 50);
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold').text(20, 90, 'Tasks completed this week: ');
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold').text(40, 110, 'Meetings');
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal').text(60, 130, document.getElementById("completed_tasks_notes").value )
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold').text(20, 460, 'Upcoming Tasks: ');
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal').text(60, 480, document.getElementById("completed_tasks_notes").value )
  
    
    doc.save('demo.pdf')
}

  render() {
    return (
      <div className="App">
        <AmplifySignOut />
        <h1>Simple Status Report System</h1>
        {/* <label> Client Name :
          <input type="text" id="clientName" name="name" />
        </label> */}
        <div id="proj">
          <label> Project Status:
            <input type="text" id="projName" name="name" />
          </label>
        </div>
        <div id="wk"> 
          <label> Week Ending:
            <input type="text" id="wkEnd" name="name" />
          </label>
        </div>
        <div id="bill"> 
          <label> AWS Billing Account ID:
            <input type="text" id="billId" name="name" />
          </label>
        </div>
        <div id="perf"> 
          <label> Period of Performance End Date:
            <input type="text" id="perfDate" name="name" />
          </label>
        </div>
        <div id="back"> 
          <label> Background:
            <input type="text" id="background" name="name" />
          </label>
        </div>
        <h3>Status Snapshot</h3>
        <div id="proj_status"> 
          <label> Overall Status:
            <input type="text" id="proj_stat" name="name" />
          </label>
          <label id="notes_label"> Notes:
            <textarea id="proj_stat_notes" name="Text1" cols="40" rows="5"></textarea>
          </label>
        </div>
        <div id="sow"> 
          <label> Total SOW Units:
            <input type="text" id="sow_input" name="name" />
          </label>
          <label id="notes_label"> Notes:
            <textarea id="sow_notes" name="Text1" cols="40" rows="5"></textarea>
          </label>
        </div>
        <div id="units_burned"> 
          <label> Units Burned:
            <input type="text" id="units_burned_input" name="name" />
          </label>
          <label id="notes_label"> Notes:
            <textarea id="units_burned_notes" name="Text1" cols="40" rows="5"></textarea>
          </label>
        </div>
        <div id="units_remaining"> 
          <label> Units Remaining:
            <input type="text" id="units_remaining_input" name="name" />
          </label>
          <label id="notes_label"> Notes:
            <textarea id="units_remaining_notes" name="Text1" cols="40" rows="5"></textarea>
          </label>
        </div>
        <div id="percent_burned"> 
          <label> Percentage Burned:
            <input type="text" id="percent_burned_input" name="name" />
          </label>
          <label id="notes_label"> Notes:
            <textarea id="percent_burned_notes" name="Text1" cols="40" rows="5"></textarea>
          </label>
        </div>
        <div id="risks"> 
          <label> Risks/Burn Rate Concerns/Scope Concerns:
            <input type="text" id="risks_input" name="name" />
          </label>
          <label id="notes_label"> Notes:
            <textarea id="risks_notes" name="Text1" cols="40" rows="5"></textarea>
          </label>
        </div>
        <h3>Forecast Units (Monthly) </h3>
        <h4>(Last year) </h4>
        <div id="jan_1">
          <label> January:
            <input type="text" id="january" name="jan_name" />
          </label>
        </div>
        <div id="feb_1">
          <label> Feburary:
            <input type="text" id="feburary" name="feb_name" />
          </label>
        </div>
        <div id="mar_1">
          <label> March:
            <input type="text" id="march" name="mar_name" />
          </label>
        </div>
        <div id="apr_1">
          <label> April:
            <input type="text" id="april" name="apr_name" />
          </label>
        </div>
        <div id="may_1">
          <label> May:
            <input type="text" id="may" name="may_name" />
          </label>
        </div>
        <div id="jun_1">
          <label> June:
            <input type="text" id="june" name="jun_name" />
          </label>
        </div>
        <div id="jul_1">
          <label> July:
            <input type="text" id="july" name="jul_name" />
          </label>
        </div>
        <div id="aug_1">
          <label> August:
            <input type="text" id="august" name="aug_name" />
          </label>
        </div>
        <div id="sept_1">
          <label> September:
            <input type="text" id="september" name="sept_name" />
          </label>
        </div>
        <div id="oct_1">
          <label> October:
            <input type="text" id="october" name="oct_name" />
          </label>
        </div>
        <div id="nov_1">
          <label> November:
            <input type="text" id="november" name="nov_name" />
          </label>
        </div>
        <div id="dec_1">
          <label> December:
            <input type="text" id="december" name="dec_name" />
          </label>
        </div>
        <h4>(This Year)</h4>
        <div id="jan_2">
          <label> January:
            <input type="text" id="january_2" name="jan_2_name" />
          </label>
        </div>
        <div id="feb_2">
          <label> Feburary:
            <input type="text" id="feburary_2" name="feb_2_name" />
          </label>
        </div>
        <div id="mar_2">
          <label> March:
            <input type="text" id="march_2" name="mar_2_name" />
          </label>
        </div>
        <div id="apr_2">
          <label> April:
            <input type="text" id="april_2" name="apr_2_name" />
          </label>
        </div>
        <div id="may_2">
          <label> May:
            <input type="text" id="May_2" name="may_2_name" />
          </label>
        </div>
        <div id="jun_2">
          <label> June:
            <input type="text" id="june_2" name="jun_2_name" />
          </label>
        </div>
        <div id="jul_2">
          <label> July:
            <input type="text" id="july_2" name="jul_2_name" />
          </label>
        </div>
        <div id="aug_2">
          <label> August:
            <input type="text" id="august_2" name="aug_2_name" />
          </label>
        </div>
        <div id="sept_2">
          <label> September:
            <input type="text" id="september_2" name="sept_2_name" />
          </label>
        </div>
        <div id="oct_2">
          <label> October:
            <input type="text" id="october_2" name="oct_2_name" />
          </label>
        </div>
        <div id="nov_2">
          <label> November:
            <input type="text" id="november_2" name="nov_2_name" />
          </label>
        </div>
        <div id="dec_2">
          <label> December:
            <input type="text" id="december_2" name="dec_2_name" />
          </label>
        </div>
        <h3>Units Burned (Monthly)</h3>
        <h4>(Last year)</h4>
        <div id="jan_3">
          <label> January:
            <input type="text" id="january_3" name="jan_3_name" />
          </label>
        </div>
        <div id="feb_3">
          <label> Feburary:
            <input type="text" id="feburary_3" name="feb_3_name" />
          </label>
        </div>
        <div id="mar_3">
          <label> March:
            <input type="text" id="march_3" name="mar_3_name" />
          </label>
        </div>
        <div id="apr_3">
          <label> April:
            <input type="text" id="april_3" name="apr_3_name" />
          </label>
        </div>
        <div id="may_3">
          <label> May:
            <input type="text" id="May_3" name="may_3_name" />
          </label>
        </div>
        <div id="jun_3">
          <label> June:
            <input type="text" id="june_3" name="jun_3_name" />
          </label>
        </div>
        <div id="jul_3">
          <label> July:
            <input type="text" id="july_3" name="jul_3_name" />
          </label>
        </div>
        <div id="aug_3">
          <label> August:
            <input type="text" id="august_3" name="aug_3_name" />
          </label>
        </div>
        <div id="sept_3">
          <label> September:
            <input type="text" id="september_3" name="sept_3_name" />
          </label>
        </div>
        <div id="oct_3">
          <label> October:
            <input type="text" id="october_3" name="oct_3_name" />
          </label>
        </div>
        <div id="nov_3">
          <label> November:
            <input type="text" id="november_3" name="nov_3_name" />
          </label>
        </div>
        <div id="dec_3">
          <label> December:
            <input type="text" id="december_3" name="dec_3_name" />
          </label>
        </div>
        <h4>(This Year)</h4>
        <div id="jan_4">
          <label> January:
            <input type="text" id="january_4" name="jan_4_name" />
          </label>
        </div>
        <div id="feb_4">
          <label> Feburary:
            <input type="text" id="feburary_4" name="feb_4_name" />
          </label>
        </div>
        <div id="mar_4">
          <label> March:
            <input type="text" id="march_4" name="mar_4_name" />
          </label>
        </div>
        <div id="apr_4">
          <label> April:
            <input type="text" id="april_4" name="apr_4_name" />
          </label>
        </div>
        <div id="may_4">
          <label> May:
            <input type="text" id="May_4" name="may_4_name" />
          </label>
        </div>
        <div id="jun_4">
          <label> June:
            <input type="text" id="june_4" name="jun_4_name" />
          </label>
        </div>
        <div id="jul_4">
          <label> July:
            <input type="text" id="july_4" name="jul_4_name" />
          </label>
        </div>
        <div id="aug_4">
          <label> August:
            <input type="text" id="august_4" name="aug_4_name" />
          </label>
        </div>
        <div id="sept_4">
          <label> September:
            <input type="text" id="september_4" name="sept_4_name" />
          </label>
        </div>
        <div id="oct_4">
          <label> October:
            <input type="text" id="october_4" name="oct_4_name" />
          </label>
        </div>
        <div id="nov_4">
          <label> November:
            <input type="text" id="november_4" name="nov_4_name" />
          </label>
        </div>
        <div id="dec_4">
          <label> December:
            <input type="text" id="december_4" name="dec_4_name" />
          </label>
        </div>
        <h3>Tasks completed this week</h3>
        <div id="completed_tasks"> 
          <label id="completed_tasks_label"> Notes:
            <textarea id="completed_tasks_notes" name="Text1" cols="75" rows="20"></textarea>
          </label>
        </div>
        <h3>Upcoming Tasks</h3>
        <div id="upcoming_tasks"> 
          <label id="upcoming_tasks_label"> Notes:
            <textarea id="upcoming_tasks_notes" name="Text1" cols="75" rows="20"></textarea>
          </label>
        </div>
        <div id="button">
          <button class="button" onClick={this.generatePDF} type="primary">Download PDF</button>
        </div>
        {/* <input type="file" onChange={onChange} />
        <input
          onChange={e => setFormData({ ...formData, 'name': e.target.value})}
          placeholder="Note name"
          value={formData.name}
        />
        <input
          onChange={e => setFormData({ ...formData, 'description': e.target.value})}
          placeholder="Note description"
          value={formData.description}
        /> */}
        {/* <button onClick={createNote}>Create Note</button> */}
        {/* <div style={{marginBottom: 30}}>
          {
            notes.map(note => (
              <div key={note.id || note.name}>
                <h2>{note.name}</h2>
                <p>{note.description}</p>
                <button onClick={() => deleteNote(note)}>Delete note</button>
                {
                  note.image && <img src={note.image} style={{width: 400}} />
                }
              </div>
            ))
          }
        </div> */}
      </div>
    )
  }
  
}

export default withAuthenticator(App);