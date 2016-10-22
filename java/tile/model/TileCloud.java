package com.lzugis.tile.model;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.HashMap;
import java.util.List;

import org.apache.commons.io.input.BOMInputStream;
import org.dom4j.Document;
import org.dom4j.DocumentHelper;
import org.dom4j.Element;
import org.dom4j.Node;

public class TileCloud {
	
	private static HashMap<String,TileLayer> tilelayers = new HashMap<String,TileLayer>();
	
	private static TileCloud tileCloud = null;
	
	public static TileCloud getInstance(){
		if(tileCloud == null){
			tileCloud = new TileCloud();
		}
		return tileCloud;
	}

	private void addTilelayer(TileLayer tilelayer) {
		tilelayers.put(tilelayer.getLayername(),tilelayer);
	}
	
	public TileLayer getTileLayer(String layername){
		return tilelayers.get(layername);
	}
	
	public void initTileLayer(File xmlFile) throws Exception{
		String xmlStr = readFiletoStr(xmlFile);
		Document doc = DocumentHelper.parseText(xmlStr);
		
		Node layerNameNode = doc.selectSingleNode("//TileMetadata/LayerName");
		String layerName = layerNameNode.getText();
		
		if(getTileLayer(layerName) == null){
			TileLayer tilelayer = new TileLayer();
			tilelayer.setLayername(layerName);
			
			Node createStartDateNode = doc.selectSingleNode("//TileMetadata/CreateStartDate");
			String createStartDate = createStartDateNode.getText();
			tilelayer.setStartDate(createStartDate);
			
			Node createEndDateNode = doc.selectSingleNode("//TileMetadata/CreateEndDate");
			String createEndDate = createEndDateNode.getText();
			tilelayer.setEndDate(createEndDate);

			Node minZoomNode = doc.selectSingleNode("//TileMetadata/MinZoom");
			String minZoom = minZoomNode.getText();
			tilelayer.setMinZoom(Integer.parseInt(minZoom));
			
			
			Node maxZoomNode = doc.selectSingleNode("//TileMetadata/MaxZoom");
			String maxZoom = maxZoomNode.getText();
			tilelayer.setMaxZoom(Integer.parseInt(maxZoom));
			
			Node tileMaxCountNode = doc.selectSingleNode("//TileMetadata/TileMaxCount");
			String tileMaxCount = tileMaxCountNode.getText();
			tilelayer.setMaxTileCount(Integer.parseInt(tileMaxCount));
			
			List<Node> tileLevels = doc.selectNodes("//TileMetadata/TileLevels/TileLevel");
			for (Node node : tileLevels) {
				Element e = (Element) node;
				TileLevel tileLevel = new TileLevel();

				Element levelNameEle = e.element("LevelName");
				tileLevel.setLevelname(Integer.parseInt(levelNameEle.getTextTrim()));
				
				Element minRowEle = e.element("MinRow");
				tileLevel.setMinrow(Integer.parseInt(minRowEle.getTextTrim()));
				
				Element maxRowEle = e.element("MaxRow");
				tileLevel.setMaxrow(Integer.parseInt(maxRowEle.getTextTrim()));
				
				Element minColumnEle = e.element("MinColumn");
				tileLevel.setMincolumn(Integer.parseInt(minColumnEle.getTextTrim()));
				
				Element maxColumnEle = e.element("MaxColumn");
				tileLevel.setMaxcolumn(Integer.parseInt(maxColumnEle.getTextTrim()));
				
				Element tileCountEle = e.element("TileCount");
				tileLevel.setTileCount(Integer.parseInt(tileCountEle.getTextTrim()));
				
				tilelayer.addTileLevel(tileLevel);
			}
			
			addTilelayer(tilelayer);
			System.out.println("初始化图层"+tilelayer.getLayername()+"完毕！");
		}
	}
	public static String readFiletoStr(File xmlFile){
		StringBuilder xmlBuilder=new StringBuilder();
		BufferedReader reader=null;
		try {
			reader = new BufferedReader(new InputStreamReader(new BOMInputStream(new FileInputStream(xmlFile))));
			String line=null;
			while((line=reader.readLine())!=null){
				xmlBuilder.append(line).append("\n");
			}
		} catch (Exception e) {
			e.printStackTrace();
		}finally{
			try {
				reader.close();
			} catch (IOException e) {
				e.printStackTrace();
			}
		}
		return xmlBuilder.toString();
	}
	
	public static HashMap<String, TileLayer> getTilelayers() {
		return tilelayers;
	}
}
