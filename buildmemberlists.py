import os
import argparse
import xml.etree.ElementTree as etree
import json

parser = argparse.ArgumentParser(description='Process a list of XML files downloaded from FDSys to produce a Sankey diagram')
parser.add_argument("filespath", help="Path to downloaded files")
args = parser.parse_args()
print args.filespath

members = {}

#path = 'C:\Users\hksr4262\Documents\hr_statuses'
path = args.filespath
listing = os.listdir(path)
tree = etree.parse(path + "\\" + listing[0])
root = tree.getroot()
congress = root.find('.//bill/congress').text
billType = root.find('.//bill/billType').text
if billType[0] == "h" or billType[0] == "H":
    chamber = "house"
if billType[0] == "s" or billType[0] == "S":
    chamber = "senate"
print congress
print billType
print chamber


for infile in listing:
  print "current file is:" + infile
  filepath = path + "\\" + infile
  tree = etree.parse(filepath)
  root = tree.getroot()
  #allcommittees = root.findall('.//committees/billCommittees/item')
  allsponsors = root.findall('.//sponsors/item')
  allcosponsors = root.findall('.//cosponsors/item')
  for item in allsponsors:
      bioidnode = item.find('bioguideId')
      if bioidnode is not None:
          bioid = bioidnode.text
          if bioid not in members:
              members[bioid] = {}
              members[bioid]['fullname'] = item.find('fullName').text
              members[bioid]['lastname'] = item.find('lastName').text
              members[bioid]['state'] = item.find('state').text
              members[bioid]['party'] = item.find('party').text
              districtnode = item.find('district')
              if districtnode is not None:
                  members[bioid]['district'] = districtnode.text

for item in allcosponsors:
     bioidnode = item.find('bioguideId')
     if bioidnode is not None:
         bioid = bioidnode.text
         if bioid not in members:
             members[bioid] = {}
             members[bioid]['fullname'] = item.find('fullName').text
             members[bioid]['lastname'] = item.find('lastName').text
             members[bioid]['state'] = item.find('state').text
             members[bioid]['party'] = item.find('party').text
             districtnode = item.find('district')
             if districtnode is not None:
                 members[bioid]['district'] = districtnode.text

with open("members_" + str(congress) + "_" + billType + ".js", 'w') as outfile:
    json.dump(members, outfile)
