import { AircraftType } from './aircraft-type'
import { AircraftDefinition } from './schemas'

import a4ec from './aircrafts/a-4e-c'
import a10a from './aircrafts/a-10a'
import a10c from './aircrafts/a-10c'
import a10c2 from './aircrafts/a-10c-2'
import b1b from './aircrafts/b-1b'
import c101cc from './aircrafts/c-101cc'
import c130 from './aircrafts/c-130'
import c17a from './aircrafts/c-17a'
import f117a from './aircrafts/f-117a'
import f16a from './aircrafts/f-16a'
import f16c50 from './aircrafts/f-16c-50'
import fa18chornet from './aircrafts/fa-18c-hornet'
import b52h from './aircrafts/b-52h'
import f4e45mc from './aircrafts/f-4e-45mc'
import f4e from './aircrafts/f-4e'
import f5e3 from './aircrafts/f-5e-3'
import f14a135gr from './aircrafts/f-14a-135-gr'
import f14b from './aircrafts/f-14b'
import f15c from './aircrafts/f-15c'
import f15ese from './aircrafts/f-15ese'
import f86fsabre from './aircrafts/f-86f-sabre'
import miragef1ce from './aircrafts/mirage-f1ce'
import miragef1ee from './aircrafts/mirage-f1ee'
import m2000c from './aircrafts/m-2000c'
import s3b from './aircrafts/s-3b'
import s3btanker from './aircrafts/s-3b-tanker'
import ch47d from './aircrafts/ch-47d'
import ch53e from './aircrafts/ch-53e'
import sh60b from './aircrafts/sh-60b'
import uh1h from './aircrafts/uh-1h'
import uh60a from './aircrafts/uh-60a'
import uh60l from './aircrafts/uh-60l'
import ah1w from './aircrafts/ah-1w'
import ah64dblkii from './aircrafts/ah-64d-blk-ii'
import rq1apredator from './aircrafts/rq-1a-predator'
import e2c from './aircrafts/e-2c'
import e3a from './aircrafts/e-3a'
import a50 from './aircrafts/a-50'
import mig15bis from './aircrafts/mig-15bis'
import mig19p from './aircrafts/mig-19p'
import mig21bis from './aircrafts/mig-21bis'
import mig23mld from './aircrafts/mig-23mld'
import mig25pd from './aircrafts/mig-25pd'
import mig29a from './aircrafts/mig-29a'
import su17m4 from './aircrafts/su-17m4'
import su25 from './aircrafts/su-25'
import il76md from './aircrafts/il-76md'
import l39za from './aircrafts/l-39za'
import mig29s from './aircrafts/mig-29s'
import mig31 from './aircrafts/mig-31'
import su24m from './aircrafts/su-24m'
import su25t from './aircrafts/su-25t'
import su27 from './aircrafts/su-27'
import su30 from './aircrafts/su-30'
import su33 from './aircrafts/su-33'
import su34 from './aircrafts/su-34'
import tu142 from './aircrafts/tu-142'
import tu160 from './aircrafts/tu-160'
import tu22m3 from './aircrafts/tu-22m3'
import tu95ms from './aircrafts/tu-95ms'
import ka50 from './aircrafts/ka-50'
import ka503 from './aircrafts/ka-50-3'
import mi24p from './aircrafts/mi-24p'
import mi8mt from './aircrafts/mi-8mt'
import mi28n from './aircrafts/mi-28n'
import j11a from './aircrafts/j-11a'
import jf17 from './aircrafts/jf-17'
import ju88a4 from './aircrafts/ju-88a4'
import sk60 from './aircrafts/sk-60'
import kj2000 from './aircrafts/kj-2000'
import mosquitofbmkvi from './aircrafts/mosquitofbmkvi'
import ajs37 from './aircrafts/ajs37'
import av8bna from './aircrafts/av8bna'
import sa342m from './aircrafts/sa342m'
import sa342l from './aircrafts/sa342l'
import vsnf4b from './aircrafts/vsn-f4b'
import vsnf4c from './aircrafts/vsn-f4c'

export const aircraftDefinitions: Record<AircraftType, AircraftDefinition> = {
  'A-4E-C': a4ec,
  'A-10A': a10a,
  'A-10C': a10c,
  'A-10C_2': a10c2,
  'B-1B': b1b,
  'C-101CC': c101cc,
  'C-130': c130,
  'C-17A': c17a,
  'F-117A': f117a,
  'F-16A': f16a,
  'F-16C_50': f16c50,
  'FA-18C_hornet': fa18chornet,
  'B-52H': b52h,
  'F-4E-45MC': f4e45mc,
  'F-4E': f4e,
  'F-5E-3': f5e3,
  'F-14A-135-GR': f14a135gr,
  'F-14B': f14b,
  'F-15C': f15c,
  'F-15ESE': f15ese,
  'F-86F Sabre': f86fsabre,
  'Mirage-F1CE': miragef1ce,
  'Mirage-F1EE': miragef1ee,
  'M-2000C': m2000c,
  'S-3B': s3b,
  'S-3B Tanker': s3btanker,
  'CH-47D': ch47d,
  'CH-53E': ch53e,
  'SH-60B': sh60b,
  'UH-1H': uh1h,
  'UH-60A': uh60a,
  'UH-60L': uh60l,
  'AH-1W': ah1w,
  'AH-64D_BLK_II': ah64dblkii,
  'RQ-1A Predator': rq1apredator,
  'E-2C': e2c,
  'E-3A': e3a,
  'A-50': a50,
  'MiG-15bis': mig15bis,
  'MiG-19P': mig19p,
  'MiG-21Bis': mig21bis,
  'MiG-23MLD': mig23mld,
  'MiG-25PD': mig25pd,
  'MiG-29A': mig29a,
  'Su-17M4': su17m4,
  'Su-25': su25,
  'IL-76MD': il76md,
  'L-39ZA': l39za,
  'MiG-29S': mig29s,
  'MiG-31': mig31,
  'Su-24M': su24m,
  'Su-25T': su25t,
  'Su-27': su27,
  'Su-30': su30,
  'Su-33': su33,
  'Su-34': su34,
  'Tu-142': tu142,
  'Tu-160': tu160,
  'Tu-22M3': tu22m3,
  'Tu-95MS': tu95ms,
  'Ka-50': ka50,
  'Ka-50_3': ka503,
  'Mi-24P': mi24p,
  'Mi-8MT': mi8mt,
  'Mi-28N': mi28n,
  'J-11A': j11a,
  'JF-17': jf17,
  'Ju-88A4': ju88a4,
  'SK-60': sk60,
  'KJ-2000': kj2000,
  MosquitoFBMkVI: mosquitofbmkvi,
  AJS37: ajs37,
  AV8BNA: av8bna,
  SA342M: sa342m,
  SA342L: sa342l,
  VSN_F4B: vsnf4b,
  VSN_F4C: vsnf4c
}
