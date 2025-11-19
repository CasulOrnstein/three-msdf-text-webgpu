import './style.css'
import { Experience } from './Experience';

const debugMode = window.location.hash.includes("debug");

new Experience(document.querySelector<HTMLDivElement>('#app')!, debugMode);
