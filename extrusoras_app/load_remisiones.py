import sys
import psycopg2
from os import scandir, rename
from os.path import abspath, splitext

def ls(ruta):
    ls = []
    for arch in scandir(ruta):
        if arch.is_file():
            if splitext(arch.path)[0][-4:]!="_END":
                ls.append({
                    'ruta' : abspath(arch.path),
                    'name': splitext(arch.path)[0],
                    'ext':splitext(arch.path)[1][1:]
                })
    return ls

files = ls(r'\\zubexsap1\Entrega\BM')

if files:
    conn = psycopg2.connect(database='controlextrusoras_2',user='usr_extrusoras',password='usr_extrusoras', host='localhost')
    cur = conn.cursor()
    try:
        for archivo in files:
            #with open(archivo['ruta'],'r', encoding='utf-16-le') as f:
            #with open(archivo['ruta'],'r') as f:
            with open(archivo['ruta'],'r', encoding='utf-16-be') as f:
                it=(lineas for i,lineas in enumerate(f) if i>=1)
                for lineas in it:
                    rem_id = rem_nextid = pro_id = pro_nextid =  None
                    rem_nextid  = lineas.split("|")[0].strip() if len(lineas.split("|"))>0 else None
                    pro_nextid  = lineas.split("|")[1].strip() if len(lineas.split("|"))>1 else None
                    rem_id  = lineas.split("|")[2].strip() if len(lineas.split("|"))>2 and lineas.split("|")[2].strip()!=''  else None
                    pro_id  = lineas.split("|")[3].strip() if len(lineas.split("|"))>3 and lineas.split("|")[3].strip()!='' else None                    
                    if rem_id is not None and pro_id is not None:
                        cur.execute("INSERT INTO remision(rem_id, rem_nextid, rem_estatus, pro_id, pro_nextid) VALUES (%(rem_id)s, %(rem_nextid)s, %(rem_estatus)s, %(pro_id)s, %(pro_nextid)s);",
                        {'rem_id': rem_id,
                        'rem_nextid':rem_nextid,
                        'rem_estatus': 'E',
                        'pro_id':pro_id,
                        'pro_nextid': pro_nextid})
                    else:
                        cur.execute("INSERT INTO remisiontmp(rem_id, pro_id) VALUES (%(rem_id)s, %(pro_id)s);",
                        {'rem_id': rem_nextid,
                        'pro_id':pro_nextid})
            cur.execute("INSERT INTO remision (rem_id, pro_id,rem_estatus) SELECT rem_nextid, pro_nextid, 'E' FROM remision WHERE rem_nextid NOT IN (SELECT rem_id FROM remision);")
            cur.execute("INSERT INTO remision (rem_id,pro_id,rem_estatus) SELECT rem_id, pro_id, 'E' FROM remisiontmp WHERE rem_id NOT IN (SELECT rem_id FROM remision WHERE rem_estatus='E');")
            cur.execute("DELETE FROM remisiontmp;")
            rename (archivo['ruta'],archivo['name']+"_END."+archivo['ext'])
    except psycopg2.Error as e:
        print(e)
    conn.commit()
    conn.close()
    f.close()