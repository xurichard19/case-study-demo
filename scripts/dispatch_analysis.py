import pandas
from tqdm import tqdm

data = pandas.read_csv('./dispatch_log_q1.csv')

def check_exception_notes():
    exception_notes = data['exception_notes']

    notes = {}
    for note in tqdm(exception_notes):
        if note not in notes:
            notes[note] = 1
        else:
            notes[note] += 1

    for note, count in notes.items():
        print(note, count)
    
    # we find that there are 64 unique exception notes
