import os
import argparse
import xml.etree.ElementTree as etree
import json

parser = argparse.ArgumentParser(description='Process a list of XML files downloaded from FDSys to produce a Sankey diagram')
parser.add_argument("filespath", help="Path to downloaded files")
args = parser.parse_args()
print args.filespath

allDict = {}
subjectDicts = {}
policyDicts = {}

#path = 'C:\Users\hksr4262\Documents\hr_statuses'
path = args.filespath
listing = os.listdir(path)
tree = etree.parse(path + "\\" + listing[0])
root = tree.getroot()
congress = root.find('.//bill/congress').text
billType = root.find('.//bill/billType').text
print congress
print billType
passedHouseCount = 0


for infile in listing:
  #print "current file is:" + infile
  filepath = path + "\\" + infile
  tree = etree.parse(filepath)
  root = tree.getroot()
  allcommittees = root.findall('.//committees/billCommittees/item')
  allsubjects = root.findall('.//billSubjects/legislativeSubjects/item')
  policynode = root.find('.//policyArea/name')
  if policynode is not None:
      policyarea = policynode.text.replace(" ","_")
  subdicts = []
  for subitem in allsubjects:
      subject = subitem.find('name').text.replace(" ","_")
      subdicts.append(subject)

  passedHouse = root.find('.//actionTypeCounts/passedAgreedToInHouse')
  if passedHouse is not None:
      passedHouseCount += 1

  for item in allcommittees:
    name = item.find('name').text
    allactivities = item.findall('./activities/item')
    for actitem in allactivities:
        action = actitem.find('name').text
        if action == "Referred to":
            mykey = "Introduced in House|" + name
        elif action == "Reported by":
            mykey = name + "|Reported to Floor"
        if mykey in allDict:
            allDict[mykey] += 1
        else:
            allDict[mykey] = 1
        for subject in subdicts:
            if subject not in subjectDicts:
                subjectDicts[subject] = {}
                subjectDicts[subject]['Reported to Floor|Passed House'] = 0
            if mykey not in subjectDicts[subject]:
                subjectDicts[subject][mykey] = 1
            else:
                subjectDicts[subject][mykey] += 1
            if passedHouse is not None:
                subjectDicts[subject]['Reported to Floor|Passed House'] += 1
            #else:
            #    subjectDicts[subject] = {}
        if policyarea is not None:
            if policyarea not in policyDicts:
                policyDicts[policyarea] = {}
                policyDicts[policyarea]['Reported to Floor|Passed House'] = 0
            if mykey not in policyDicts[policyarea]:
                policyDicts[policyarea][mykey] = 1
            else:
                policyDicts[policyarea][mykey] += 1
            if passedHouse is not None:
                policyDicts[policyarea]['Reported to Floor|Passed House'] += 1



print allDict
subjectDicts['All_subjects'] = allDict
policyDicts['All_areas'] = allDict

#filename = "sankeytotals_" + str(congress) + "_" + billType + ".js"
#f = open(filename, 'w')
#f.write('var allbills = [')

#for key, value in allDict.iteritems():
#    myparts = key.split("|")
#    dictLine = '[ "' + myparts[0] + '", "'  + myparts[1] + '", ' + str(value) + ' ],'
#    f.write(dictLine + '\n')
#f.write('[ "Reported to Floor", "Passed House",' + str(passedHouseCount) + ']')
#f.write(']')
#f.close()

with open("sankeysubjects_" + str(congress) + "_" + billType + ".js", 'w') as outfile:
    json.dump(subjectDicts, outfile)

with open("sankeypolicyareas_" + str(congress) + "_" + billType + ".js", 'w') as outfile:
    json.dump(policyDicts, outfile)
