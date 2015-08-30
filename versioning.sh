#!/bin/bash

DATETIME=`date "+%y%m%d-%H%M"`

sed -i -e "s/?asset-version/?${DATETIME}/g" index.html
