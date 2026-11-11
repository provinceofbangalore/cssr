import React,{createContext,useContext,useEffect,useMemo,useState} from 'react';
import {BrowserRouter,Routes,Route,Navigate} from 'react-router-dom';
import {Toaster} from 'react-hot-toast';import {api} from './api.js';import {fallbackMenus,fallbackSettings,fallbackSlides} from './content.js';
import Layout from './components/Layout.jsx';import Home from './pages/Home.jsx';import ContentPage from './pages/ContentPage.jsx';import Blog from './pages/Blog.jsx';import Contact from './pages/Contact.jsx';import Search from './pages/Search.jsx';import AdminLogin from './admin/AdminLogin.jsx';import AdminShell from './admin/AdminShell.jsx';
const SiteContext=createContext(null);export const useSite=()=>useContext(SiteContext);
const AuthContext=createContext(null);export const useAuth=()=>useContext(AuthContext);
export default function App(){
 const [theme,setTheme]=useState(localStorage.getItem('cssr-theme')||'light'),[lang,setLang]=useState(localStorage.getItem('cssr-lang')||'en');
 const [site,setSite]=useState({settings:fallbackSettings,menus:fallbackMenus,slides:fallbackSlides});
 const [me,setMe]=useState(null),[authLoading,setAuthLoading]=useState(true);
 const refreshSite=()=>api('/public/site').then(setSite).catch(()=>{});
 useEffect(()=>{refreshSite();api('/auth/me').then(setMe).catch(()=>setMe(null)).finally(()=>setAuthLoading(false))},[]);
 useEffect(()=>{document.documentElement.setAttribute('data-bs-theme',theme);localStorage.setItem('cssr-theme',theme)},[theme]);
 useEffect(()=>{localStorage.setItem('cssr-lang',lang);document.documentElement.lang=lang},[lang]);
 const context=useMemo(()=>({site,refreshSite,theme,setTheme,lang,setLang}),[site,theme,lang]);
 return <SiteContext.Provider value={context}><AuthContext.Provider value={{me,setMe,authLoading}}><BrowserRouter><Routes>
  <Route path="/admin/login" element={<AdminLogin/>}/><Route path="/admin/*" element={<AdminShell/>}/>
  <Route element={<Layout/>}><Route index element={<Home/>}/><Route path="blog" element={<Blog/>}/><Route path="blog/:slug" element={<Blog article/>}/><Route path="contact" element={<Contact/>}/><Route path="search" element={<Search/>}/><Route path="*" element={<ContentPage/>}/></Route>
 </Routes></BrowserRouter><Toaster position="top-right" toastOptions={{duration:3000}}/></AuthContext.Provider></SiteContext.Provider>
}
