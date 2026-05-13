import * as Tone from 'tone';
import { SongSection } from './MusicTypes';

export class MixEngine {
    private mainFilter: Tone.Filter;
    private guitarSidechain: Tone.AmplitudeEnvelope;
    public instruments: Record<string, any> = {};
    public instrumentGains: Record<string, Tone.Gain> = {};
    private volumes: Record<string, number> = {
        guitar: 0.7,
        bass: 0.6,
        drums: 0.7,
        crash: 0.3,
        ride: 0.5,
        china: 0.4
    };

    public guitarLoaded: boolean = false;
    public bassLoaded: boolean = false;

    constructor() {
        this.initInstruments();
    }

    private initInstruments() {
        const guitarSamplesMap = {
            "C3": "C3.wav",
            "E3": "E2.wav",
            "G3": "G3.wav",
            "A3": "A3.wav",
            "C4": "C4.wav",
        };

        const bassCorrectedSamples = {
            "E1": "E1.wav",
            "G1": "G1.wav",
            "A1": "As1.wav",
            "C2": "Cs1.wav",
        };

        this.mainFilter = new Tone.Filter(20000, "lowpass").toDestination();

        Object.keys(this.volumes).forEach(key => {
            this.instrumentGains[key] = new Tone.Gain(this.volumes[key]).connect(this.mainFilter);
        });

        this.guitarSidechain = new Tone.AmplitudeEnvelope({
            attack: 0.001,
            decay: 0.1,
            sustain: 1.0,
            release: 0.2
        }).connect(this.instrumentGains['guitar']);

        const createGuitarSampler = (label: string) => new Tone.Sampler({
            urls: guitarSamplesMap,
            baseUrl: "assets/samples/guitar-acoustic/",
            onload: () => {
                if (label === 'L') this.guitarLoaded = true;
                console.log(`[MixEngine] Electric Guitar ${label} samples loaded`);
            }
        });

        const guitarL = createGuitarSampler('L');
        const guitarR = createGuitarSampler('R');
        const guitarPannerL = new Tone.Panner(-0.4);
        const guitarPannerR = new Tone.Panner(0.4);
        const guitarDist = new Tone.Distortion(0.4);
        const guitarEQ = new Tone.EQ3({ low: 2, mid: -4, high: -6 });
        const guitarCab = new Tone.Filter(5000, "lowpass");

        guitarL.connect(guitarPannerL);
        guitarPannerL.connect(guitarDist);
        guitarDist.connect(guitarEQ);
        guitarEQ.connect(guitarCab);
        guitarCab.connect(this.instrumentGains['guitar']);

        guitarR.connect(guitarPannerR);
        guitarPannerR.connect(guitarDist);
        guitarDist.connect(guitarEQ);
        guitarEQ.connect(guitarCab);
        guitarCab.connect(this.instrumentGains['guitar']);

        this.instruments.guitarL = guitarL;
        this.instruments.guitarR = guitarR;

        const bass = new Tone.Sampler({
            urls: bassCorrectedSamples,
            baseUrl: "assets/samples/bass-electric/",
            onload: () => {
                this.bassLoaded = true;
                console.log('[MixEngine] Electric Bass samples loaded');
            }
        });
        const bassDist = new Tone.Distortion(0.2);
        const bassFilter = new Tone.Filter(200, "lowpass");

        bass.connect(bassDist);
        bassDist.connect(this.instrumentGains['bass']);
        this.instrumentGains['bass'].connect(bassFilter);
        bassFilter.connect(this.mainFilter);
        this.instruments.bass = bass;

        const drumOut = new Tone.Gain(this.volumes.drums);
        drumOut.connect(this.mainFilter);
        this.instrumentGains['drums'] = drumOut;

        this.instruments.drums = {
            kick: new Tone.MembraneSynth().connect(drumOut),
            snare: new Tone.NoiseSynth({
                noise: { type: "white" },
                envelope: { attack: 0.001, decay: 0.2, sustain: 0 }
            }).connect(drumOut),
            hihat: new Tone.MetalSynth({
                frequency: 200,
                envelope: { attack: 0.001, decay: 0.1, release: 0.01 },
                harmonicity: 5.1,
                modulationIndex: 32,
            }).connect(drumOut),
            ride: new Tone.MetalSynth({
                frequency: 400,
                envelope: { attack: 0.001, decay: 0.4, release: 0.2 },
                harmonicity: 2.1,
                modulationIndex: 16,
            }).connect(drumOut),
            china: new Tone.MetalSynth({
                frequency: 800,
                envelope: { attack: 0.001, decay: 0.8, release: 0.1 },
                harmonicity: 10.1,
                modulationIndex: 64,
            }).connect(drumOut)
        };

        this.instruments.crashCymbal = new Tone.NoiseSynth({
            noise: { type: "white" },
            envelope: { attack: 0.001, decay: 1.0, sustain: 0 }
        });
        this.instruments.crashCymbal.connect(this.instrumentGains['crash']);
        this.instrumentGains['crash'].toDestination();
    }

    public updateIntensityFilter(intensity: number) {
        const freq = 400 + (intensity * 19600);
        this.mainFilter.frequency.rampTo(freq, 0.5);
    }

    public triggerSidechain(time: number) {
        this.guitarSidechain.triggerAttackRelease(0.1, time);
    }

    public setVolume(instrument: string, volume: number) {
        if (this.instrumentGains[instrument]) {
            this.volumes[instrument] = volume;
            this.instrumentGains[instrument].gain.rampTo(volume, 0.1);
        }
    }
}
