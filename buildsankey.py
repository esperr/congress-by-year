import os
import argparse
import xml.etree.ElementTree as etree

parser = argparse.ArgumentParser(description='Process a list of XML files downloaded from FDSys to produce a Sankey diagram')
parser.add_argument("filespath", help="Path to downloaded files")
args = parser.parse_args()
print args.filespath


allDict = {}

#path = 'C:\Users\hksr4262\Documents\hr_statuses'
path = args.filespath
listing = os.listdir(path)
tree = etree.parse(path + "\\" + listing[0])
root = tree.getroot()
congress = root.find('.//bill/congress').text
print congress
passedHouseCount = 0


for infile in listing:
  #print "current file is:" + infile
  filepath = path + "\\" + infile
  tree = etree.parse(filepath)
  root = tree.getroot()
  allcommittees = root.findall('.//committees/billCommittees/item')
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

print allDict
filename = "sankeytotals_" + str(congress) + ".js"
f = open(filename, 'w')
f.write('var allbills = [')

for key, value in allDict.iteritems():
    myparts = key.split("|")
    dictLine = '[ "' + myparts[0] + '", "'  + myparts[1] + '", ' + str(value) + ' ],'
    f.write(dictLine + '\n')
    #print '[ "' + myparts[0] + '", "'  + myparts[1] + '", ' + str(value) + ' ],'
f.write('[ "Reported to Floor", "Passed House",' + str(passedHouseCount) + ']')
f.write(']')
f.close()
