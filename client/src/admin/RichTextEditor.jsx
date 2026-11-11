import {CKEditor} from '@ckeditor/ckeditor5-react';
import {ClassicEditor,Essentials,Paragraph,Heading,Bold,Italic,Underline,Link,List,BlockQuote,Table,TableToolbar,HorizontalLine,GeneralHtmlSupport} from 'ckeditor5';
import 'ckeditor5/ckeditor5.css';

const config={
  licenseKey:'GPL',
  plugins:[Essentials,Paragraph,Heading,Bold,Italic,Underline,Link,List,BlockQuote,Table,TableToolbar,HorizontalLine,GeneralHtmlSupport],
  toolbar:['heading','|','bold','italic','underline','|','link','bulletedList','numberedList','blockQuote','insertTable','horizontalLine','|','undo','redo'],
  heading:{options:[
    {model:'paragraph',title:'Paragraph',class:'ck-heading_paragraph'},
    {model:'heading1',view:'h1',title:'Heading 1',class:'ck-heading_heading1'},
    {model:'heading2',view:'h2',title:'Heading 2',class:'ck-heading_heading2'},
    {model:'heading3',view:'h3',title:'Heading 3',class:'ck-heading_heading3'},
    {model:'heading4',view:'h4',title:'Heading 4',class:'ck-heading_heading4'}
  ]},
  table:{contentToolbar:['tableColumn','tableRow','mergeTableCells']},
  htmlSupport:{allow:[{name:/^(p|h[1-4]|ul|ol|li|blockquote|a|hr|figure|table|thead|tbody|tr|td|th)$/,attributes:true,classes:true,styles:true}]}
};

export default function RichTextEditor({data,onChange}){
  return <div className="content-rich-editor">
    <CKEditor editor={ClassicEditor} data={data} config={config} onChange={(_event,editor)=>onChange(editor.getData())}/>
  </div>;
}
