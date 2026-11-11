import React from 'react';
import {CKEditor} from '@ckeditor/ckeditor5-react';
import {Alignment,Autoformat,BlockQuote,Bold,Essentials,Heading,Image,ImageResize,ImageToolbar,ImageUpload,Indent,Italic,Link,List,Paragraph,Table,TableToolbar,Underline,Undo,ClassicEditor,Plugin} from 'ckeditor5';
import 'ckeditor5/ckeditor5.css';
import {api} from '../api.js';

class MediaUploadAdapter {
 constructor(loader){this.loader=loader;this.controller=new AbortController()}
 async upload(){
  const file=await this.loader.file;
  const form=new FormData();
  form.append('file',file);
  const media=await api('/admin/media/upload',{method:'POST',body:form,signal:this.controller.signal});
  return {default:media.url};
 }
 abort(){this.controller.abort()}
}

class MediaUploadPlugin extends Plugin {
 static get requires(){return [ImageUpload]}
 init(){this.editor.plugins.get('FileRepository').createUploadAdapter=loader=>new MediaUploadAdapter(loader)}
}

const config={
 licenseKey:'GPL',
 plugins:[Alignment,Autoformat,BlockQuote,Bold,Essentials,Heading,Image,ImageResize,ImageToolbar,ImageUpload,Indent,Italic,Link,List,Paragraph,Table,TableToolbar,Underline,Undo,MediaUploadPlugin],
 toolbar:['undo','redo','|','heading','|','bold','italic','underline','link','|','bulletedList','numberedList','outdent','indent','|','alignment','blockQuote','insertTable','uploadImage'],
 image:{upload:{types:['jpeg','png','webp']},toolbar:['imageTextAlternative','toggleImageCaption','imageStyle:inline','imageStyle:block','imageStyle:side','resizeImage']},
 table:{contentToolbar:['tableColumn','tableRow','mergeTableCells']},
};

export default function RichTextEditor({id,value,onChange}){
 return <div className="rich-text-editor">
  <CKEditor
   id={id}
   editor={ClassicEditor}
   config={config}
   data={value||''}
   onChange={(_event,editor)=>onChange(editor.getData())}
  />
 </div>;
}
