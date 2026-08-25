"use client";
import RegionalMap from './RegionalMap';
import {Map, Source, Layer} from '@vis.gl/react-maplibre';
import {setWorkerUrl} from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css'; 

setWorkerUrl('/maplibre/maplibre-gl-worker.mjs');

export default function Home() {
  return <RegionalMap></RegionalMap>
}