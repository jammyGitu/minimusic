// plugins/Roll/index.tsx - 钢琴卷帘块插件

import React, { useContext, useState, memo, useCallback, useMemo } from 'react';
import { Transforms, Element } from 'slate';
import { useSelected } from 'slate-react';
import { CommandsContext, ConfigContext } from '../../context';
import { BlockWrapper } from '../../nodes';
import { CustomElement, MODE, RollData } from '../../types';
import { moaTone } from '@/utils/MoaTone';
import styles from './roll.module.scss';
import classNames from 'classnames';

interface RollElement extends CustomElement {
  type: 'roll';
  data: Partial<RollData>;
}

const PIANO_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const OCTAVES = [2, 3, 4, 5, 6];

export const Roll = memo((props: any) => {
  const { attributes, children, element } = props;
  const rollElement = element as RollElement;
  const commands = useContext(CommandsContext);
  const editor = commands?.editor;
  const config = useContext(ConfigContext);
  
  const selected = useSelected();
  const isView = config.mode === MODE.VIEW;
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm, setBpm] = useState(rollElement.data?.timeLength || 16);
  const [currentTrack, setCurrentTrack] = useState(rollElement.data?.currentTrack || 'piano');
  
  const tracks = useMemo(() => 
    rollElement.data?.tracks || [
      { range: ['C3', 'C5'], instrument: 'piano', notes: [] },
      { instrument: 'drum', notes: [] },
    ],
    [rollElement.data?.tracks]
  );
  
  const updateData = useCallback((newData: Partial<RollData>) => {
    if (!editor) return;
    
    const updatedData = {
      ...rollElement.data,
      ...newData,
    };
    
    Transforms.setNodes(
      editor,
      { data: updatedData } as Partial<CustomElement>,
      { match: (n) => Element.isElement(n) && (n as any).type === 'roll' }
    );
  }, [editor, rollElement.data]);
  
  const playPreview = useCallback((note: string) => {
    moaTone.playNote(note, 0.2);
  }, []);
  
  const playSequence = useCallback(() => {
    if (isPlaying) return;
    
    setIsPlaying(true);
    
    const timeLength = bpm;
    const tempo = 500;
    
    const allNotes: Array<{ time: number; note: string; duration: number }> = [];
    
    tracks.forEach(track => {
      if (track.instrument === 'drum') {
        track.notes?.forEach(note => {
          allNotes.push({
            time: note.start * tempo / 4,
            note: 'C4',
            duration: note.duration * tempo / 4,
          });
        });
      } else {
        track.notes?.forEach(note => {
          const octave = Math.floor(note.pitch / 12) + 4;
          const noteIndex = note.pitch % 12;
          const noteName = PIANO_NOTES[noteIndex];
          allNotes.push({
            time: note.start * tempo / 4,
            note: `${noteName}${octave}`,
            duration: note.duration * tempo / 4,
          });
        });
      }
    });
    
    allNotes.sort((a, b) => a.time - b.time);
    
    allNotes.forEach(({ time, note, duration }) => {
      setTimeout(() => {
        moaTone.playNote(note, duration / 1000);
      }, time);
    });
    
    const totalDuration = (timeLength * tempo) / 4 + 500;
    setTimeout(() => setIsPlaying(false), totalDuration);
  }, [isPlaying, bpm, tracks]);
  
  const toggleTrack = useCallback((trackType: string) => {
    setCurrentTrack(trackType);
  }, []);
  
  const generateNotes = useMemo(() => {
    const allNotes: { pitch: number; start: number; duration: number }[] = [];
    
    tracks.forEach(track => {
      if (track.instrument === currentTrack) {
        track.notes?.forEach(note => {
          allNotes.push(note);
        });
      }
    });
    
    return allNotes;
  }, [tracks, currentTrack]);
  
  const noteRows = useMemo(() => {
    const rows = [];
    const startOctave = 3;
    const endOctave = 5;
    
    for (let octave = endOctave; octave >= startOctave; octave--) {
      for (let i = PIANO_NOTES.length - 1; i >= 0; i--) {
        const note = PIANO_NOTES[i];
        const fullNote = `${note}${octave}`;
        const isBlack = note.includes('#');
        
        rows.push({
          note: fullNote,
          pitch: (octave - 4) * 12 + i,
          isBlack,
        });
      }
    }
    
    return rows;
  }, []);
  
  const renderNoteBlocks = useCallback((pitch: number) => {
    return generateNotes
      .filter(n => n.pitch === pitch)
      .map((note, idx) => (
        <div
          key={idx}
          className={styles['item-note']}
          style={{
            left: `${note.start * 26}px`,
            width: `${note.duration * 26 - 4}px`,
          }}
          onClick={() => playPreview(PIANO_NOTES[note.pitch % 12] + (Math.floor(note.pitch / 12) + 4))}
        />
      ));
  }, [generateNotes]);
  
  const gridCells = useMemo(() => {
    return Array.from({ length: bpm }).map((_, i) => (
      <div key={i} className={styles.item} />
    ));
  }, [bpm]);
  
  return (
    <BlockWrapper attributes={attributes} selected={selected}>
      <div className={styles['moa-roll']}>
        <div className={styles.sider}>
          <div
            className={classNames(styles['sider-item'], currentTrack === 'piano' && styles['sider-item--active'])}
            onClick={() => toggleTrack('piano')}
          >
            piano
          </div>
          <div
            className={classNames(styles['sider-item'], currentTrack === 'drum' && styles['sider-item--active'])}
            onClick={() => toggleTrack('drum')}
          >
            drum
          </div>
        </div>
        
        <div className={styles.content}>
          <div className={styles.header}>
            <div className={styles['header-title']}>🎹 钢琴卷帘</div>
            <div className={styles['header-controls']}>
              <div className={styles['bpm-control']}>
                <span>bpm: {bpm}</span>
                <input
                  type="range"
                  min="4"
                  max="32"
                  value={bpm}
                  onChange={(e) => setBpm(Number(e.target.value))}
                  className={styles['bpm-slider']}
                />
              </div>
              <button
                className={styles['play-btn']}
                onClick={playSequence}
                disabled={isPlaying}
              >
                {isPlaying ? 'playing...' : 'play'}
              </button>
            </div>
          </div>
          
          <div className={styles.timeline}>
            {Array.from({ length: bpm }).map((_, i) => (
              <div key={i} className={styles['timeline-beat']}>
                {i + 1}
              </div>
            ))}
          </div>
          
          <div className={styles.container}>
            <div className={styles.keys}>
              {noteRows.map((row) => (
                <div
                  key={row.pitch}
                  className={classNames(styles.key, row.isBlack && styles['key--pitch'])}
                  onClick={() => playPreview(row.note)}
                >
                  <span>{row.note}</span>
                </div>
              ))}
            </div>
            
            <div className={styles.notes}>
              {noteRows.map((row) => (
                <div key={row.pitch} className={styles['notes-row']}>
                  <div className={styles['item-grid-row']}>
                    {gridCells}
                  </div>
                  <div className={styles['item-notes']}>
                    {renderNoteBlocks(row.pitch)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {children}
      </div>
    </BlockWrapper>
  );
});

Roll.displayName = 'Roll';
