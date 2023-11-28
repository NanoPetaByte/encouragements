
import json
import base64
import pandas
import requests

from io import StringIO

output = []
request = requests.get("https://docs.google.com/spreadsheets/d/19hVNCL7zL-Zi2ErEdSXrinPI6Nfy2BS1pWS73qT6e9o/export?format=csv&gid=0")
names = pandas.read_csv(StringIO(request.text))
unique = [[], [], [], 0, []]
tribes = {
    "lighters2": "black",
    "lighters3": "green",
    "chosen2": "blue",
    "chosen1": "red",
    "mtc4": "black",
    "mtc3": "green",
    "lighters1": "blue",
    "revolution": "red"
}

# Search for unique names

for index in names.index:
    parsed = {
        "Full Name": "".join(names["Full Name"][index].split(" ")).lower(),
        "First Name": "".join(names["First Name"][index].split(" ")).lower(),
        "Last Name": "".join(names["Last Name"][index].split(" ")).lower()
    }
    if parsed["First Name"] in parsed["Full Name"] and parsed["Last Name"] in parsed["Full Name"]:
        display = parsed["First Name"] + parsed["Last Name"]
        if display not in unique[0]:
            if len(parsed["First Name"]) > unique[3]:
                unique[3] = len(parsed["First Name"])
            unique[0].append(display)
        else:
            unique[0].remove(display)
            unique[1].append(display)
    else:
        print("Ejected:", parsed["Full Name"])

# Add to Output

for index in names.index:
    parsed = {
        "Full Name": "".join(names["Full Name"][index].split(" ")).lower(),
        "First Name": "".join(names["First Name"][index].split(" ")).lower(),
        "Last Name": "".join(names["Last Name"][index].split(" ")).lower(),
    }
    id_ = base64.b64encode((parsed["Full Name"] + names["E-mail Address"][index]).encode()).decode()[0:unique[3]]
    if parsed["Full Name"] not in unique[4]:
        if id_ not in unique[2]:
            if (parsed["First Name"] + parsed["Last Name"]) in unique[1]:
                display = names["Full Name"][index]
            else:
                if len(parsed["First Name"] + parsed["Last Name"]) == len(parsed["Full Name"]):
                    display = names["Full Name"][index]
                else:
                    display = names["First Name"][index] + " " + names["Last Name"][index]
            if parsed["Full Name"] in ["zavierchiamyixuan", "ryantanshiloong"]:
                output.append([
                    " ".join([item.capitalize() for item in display.split(" ")]),
                    names["Lifegroup"][index],
                    tribes["".join(names["Lifegroup"][index].split(" ")).lower()],
                    names["E-mail Address"][index],
                    id_
                ])
                unique[2].append(id_)
        unique[4].append(parsed["Full Name"])
    else:
        print("Repeating: " + names["Full Name"][index])

with open("output.json", "w") as file_:
    file_.write(json.dumps(output))
    file_.close()

print(len(unique[2]), len(names.index))